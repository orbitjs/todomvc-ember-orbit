# todomvc-ember-orbit

This is a [TodoMVC](https://github.com/tastejs/todomvc) app that uses
[Ember.js](https://github.com/emberjs/ember.js) (Octane edition) and
[ember-orbit](https://github.com/orbitjs/ember-orbit) on the client-side.

This repo also contains a server implementation that uses
[orbit-server](https://github.com/tchak/orbit-server) to provide
[JSON:API](https://jsonapi.org) endpoints for some of the scenarios below.

## Installation

This repo uses a yarn workspace to manage dependencies. All dependencies can be
installed via:

```
yarn install
```

## Running

To run the client app:

```
cd ./client
yarn start
```

To run the server app (optional for many scenarios below):

```
cd ./server
yarn start
```

The demo can then be accessed at: http://localhost:4200

## Scenario 1: Memory-only

The default application just relies on the in-memory `store` service that's
installed by default by `ember-orbit`.

Since data is only kept in memory, you'll be starting over with each page
refresh.

## Scenario 2: Memory + Backup

In order to persist data, one option is to connect your store to browser-based
storage such as IndexedDB.

To configure this scenario, run the following from the `./client` directory
(_note: the first reset step is only necessary if you've made local changes to
the repo_):

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

## Scenario 3: Memory + Remote

An alternative to using brower storage is to fetch and persist data to a backend
server. Let's add an `@orbit/jsonapi` source that will communicate with our
demo server.

To configure this scenario, run the following from the `./client` directory:

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

## Scenario 4: Memory + Backup + Remote

A more robust approach to providing an optimistic UI is to use a backup source
to capture local data AND a data bucket to capture all in-flight state for
sources. This combination should prevent data loss, even when your app is closed
accidentally.

To configure this scenario, run the following from the `./client` directory:

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

## Error Handling

TODO: Add some error handling strategies once the server has been fixed to
respond with appropriate errors.

## License

MIT License (see LICENSE for details).
