# todomvc-ember-orbit

This is a [TodoMVC](https://github.com/tastejs/todomvc) app that uses
[Ember.js](https://github.com/emberjs/ember.js) (Octane edition) and
[ember-orbit](https://github.com/orbitjs/ember-orbit) on the client-side.

The client app is compatible with
[todomvc-orbit-server](https://github.com/orbitjs/todomvc-orbit-server), a
simple server implementation that uses
[orbit-server](https://github.com/tchak/orbit-server) to provide
[JSON:API](https://jsonapi.org) endpoints for some of the scenarios below.

## Installation

To install dependencies:

```
yarn install
```

## Running

To run the server app (which is optional for many scenarios below), follow the
instructions for
[todomvc-orbit-server](https://github.com/orbitjs/todomvc-orbit-server).

To run the client app:

```
yarn start
```

The demo can then be accessed at: http://localhost:4200

## Scenarios

The following scenarios illustrate different configurations of sources and
coordination strategies that can be used to build different kinds of
applications with `ember-orbit`.

> **Important**: If you are running a pre-release version (i.e. alpha or beta) of
`ember-orbit`, then you'll want to ensure that corresponding pre-release
versions of Orbit dependencies are referenced in your `package.json` after
running the ember generators described below. By default, running the generators
will install the latest stable releases, which may be incompatible.

### Scenario 1: Memory-only

The default application just relies on the in-memory `store` service that's
installed by default by `ember-orbit`.

Since data is only kept in memory, you'll be starting over with each page
refresh.

### Scenario 2: Memory + Backup

In order to persist data, one option is to connect your store to browser-based
storage such as IndexedDB.

To configure this scenario, run the following (_note: the first reset step is
only necessary if you've made local changes to the repo_):

```bash
git reset --hard && git clean -f -d && yarn install

ember g data-source backup --from=@orbit/indexeddb
ember g data-strategy store-backup-sync
```

This will generate a `backup` source and add a sync strategy that observes
the `store` and syncs any mutations to `backup`.

After restarting your app (`yarn start`), data should now be persisted across
page refreshes.

You may wonder how the `store` is populated from `backup` in the first place.
The `application` route's `beforeModel` hook checks for a `backup` source in the
coordinator and, if one is present, populates the `store` prior to activating
the coordinator:

```javascript
  // app/routes/application.js

  async beforeModel() {
    console.log("Sources:", this.dataCoordinator.sourceNames);

    // If a backup source is present, populate the store from backup prior to
    // activating the coordinator
    const backup = this.dataCoordinator.getSource("backup");
    if (backup) {
      const transform = await backup.pull(q => q.findRecords());
      await this.store.sync(transform);
    }

    await this.dataCoordinator.activate();
    await this.store.query(q => q.findRecords("todo"));
  }
```

### Scenario 3: Memory + Remote

An alternative to using browser storage is to fetch and persist data to a backend
server. Let's add an `@orbit/jsonapi` source that will communicate with our
demo server.

To configure this scenario, run the following:

```bash
git reset --hard && git clean -f -d && yarn install

ember g data-source remote --from=@orbit/jsonapi
ember g data-strategy remote-store-sync
ember g data-strategy store-beforequery-remote-query
ember g data-strategy store-beforeupdate-remote-update
```

This will generate a `remote` source and add sync and request strategies that
connect it to your `store`.

Make sure to start both your server and client before trying it out.

Because all strategies are pessimistic (i.e.
`blocking: true`) by default, data will only be persisted locally after it has
been persisted remotely.

If you change your request strategies to be optimistic (i.e. `blocking: false`),
then requests will succeed locally regardless of whether they succeed remotely.
However, this approach is not recommended unless it's paired with a local
backup.

#### Pessimistic Error Handling

It's important that errors are handled appropriately in Orbit. Once an error
occurs processing a request, that source's `requestQueue` will be paused,
waiting for you to handle the issue and then restart processing the queue.

In a pessimistic scenario, you can be assured that a failure on the `remote`
source will also block the `requestQueue` for the `store`.

A simplistic strategy for handling failures would be to log the errors,
skip the current task in the queues, and then re-throw the error so that it
could be handled at the call site. Let's do this by editing
`app/data-strategies/store-beforeupdate-remote-update.js` to include a `catch`
handler:

```javascript
      catch(e, transform) {
        console.log("Error performing remote.update()", transform, e);
        this.source.requestQueue.skip(e);
        this.target.requestQueue.skip(e);
        throw e;
      },
```

Note that you might want to inspect the error and perform some custom error
handling, perhaps even choosing to not rethrow the error (e.g. if a record
is being deleted and the server returns a 404).

You may also choose to add some custom error handling at the call site in the
component layer:

```javascript
  @action async removeTodo() {
    try {
      await this.args.todo.remove();
    } catch (e) {
      // Custom error handling here
      alert("An unexpected error occurred.");
    }
  }
```

Remember to also provide error handling for queries as well as updates.

### Scenario 4: Memory + Backup + Remote

In order to provide a robust optimistic UI it's recommended that you use a
backup source to capture local data AND a data bucket to capture all in-flight
state for sources. This combination should prevent data loss, even when your app
is closed accidentally.

To configure this scenario, run the following:

```bash
git reset --hard && git clean -f -d && yarn install

ember g data-source backup --from=@orbit/indexeddb
ember g data-source remote --from=@orbit/jsonapi
ember g data-strategy store-backup-sync
ember g data-strategy remote-store-sync
ember g data-strategy store-beforequery-remote-query
ember g data-strategy store-beforeupdate-remote-update
ember g data-bucket main
```

Next, change the request strategies to be optimistic by changing
`blocking: true` to `blocking: false` in the request strategies:

- `app/data-strategies/store-beforequery-remote-query.js`
- `app/data-strategies/store-beforeupdate-remote-update.js`

#### Optimistic Error Handling

Error handling is, by necessity, a bit different for optimistic strategies than
for pessimistic strategies. Optimistic strategies won't block the successful
completion of an action based upon what happens downstream. For instance, a
record might be added or removed from the `store` without knowing whether the
subsequent request to the `remote` source will be successful.

In order to handle these scenarios well, you need to consider the different
types of errors that may occur and make a plan for each. For instance, you
should consider whether you want to handle queries differently from updates.
Orbit gives you pretty complete control, so let's talk through a few scenarios.

Let's say that, in the event of a network outage, you want to do the following:

- Drop any remote _query_ requests that have hung. Instead, you'll just rely on
  client-side data until you're back online.

- Queue any _update_ requests that can't be processed immediately and then
  periodically retry them.

These scenarios _could_ be handled via `catch` handlers in:

- `app/data-strategies/store-beforequery-remote-query.js`
- `app/data-strategies/store-beforeupdate-remote-update.js`

For instance, query requests could be dropped with:

```javascript
      catch() {
        // skip the current query request in the remote queue
        this.target.requestQueue.skip();
      },
```

This will only apply to query requests initiated by this particular strategy
(which may be just fine for this app).

If you prefer to instead provide an error-handling strategy that will apply to
remote queries that fail _regardless of where the request originated_, create a
specific strategy that observes the `queryFail` event on the `remote` source:

```bash
ember g data-strategy remote-queryfail
```

Then edit `app/data-strategies/remote-queryfail.js`:

```javascript
import { RequestStrategy } from "@orbit/coordinator";

export default {
  create() {
    return new RequestStrategy({
      name: "remote-queryfail",
      source: "remote",
      on: "queryFail",
      action() {
        this.source.requestQueue.skip();
      }
    });
  }
};
```

Now let's implement a more advanced update failure handling strategy:

```bash
ember g data-strategy remote-updatefail
```

Then edit `app/data-strategies/remote-updatefail.js`:

```javascript
import { RequestStrategy } from "@orbit/coordinator";
import { NetworkError } from "@orbit/data";

export default {
  create() {
    return new RequestStrategy({
      name: "remote-updatefail",
      source: "remote",
      on: "updateFail",

      action(transform, e) {
        const remote = this.source;
        const store = this.coordinator.getSource("store");

        if (e instanceof NetworkError) {
          // When network errors are encountered, try again in 3s
          console.log("NetworkError - will try again soon");
          setTimeout(() => {
            remote.requestQueue.retry();
          }, 3000);
        } else {
          // When non-network errors occur, notify the user and
          // reset state.
          let label = transform.options && transform.options.label;
          if (label) {
            alert(`Unable to complete "${label}"`);
          } else {
            alert(`Unable to complete operation`);
          }

          // Roll back store to position before transform
          if (store.transformLog.contains(transform.id)) {
            console.log("Rolling back - transform:", transform.id);
            store.rollback(transform.id, -1);
          }

          return remote.requestQueue.skip();
        }
      }
    });
  }
};
```

As described in the comments, this strategy treats network errors differently
from non-network errors. Network errors during updates will simply retry the
current request every few seconds. However, if another type of error occurs,
such as a 4xx or 5xx error, then the user will be notified, the store will be
rolled back to a position before the transform, and the transform will be
skipped in the queue. This is a rather brute force approach to dealing with
errors. Even better would be to analyze the error (`e`) and attempt to figure
out what went wrong and whether it could be corrected.

## License

MIT License (see LICENSE for details).
