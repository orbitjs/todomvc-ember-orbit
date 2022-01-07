import { module, test } from 'qunit';
import { visit, currentURL } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import { waitForSource } from 'ember-orbit/test-support';

module('Acceptance | home', function (hooks) {
  setupApplicationTest(hooks);

  test('visiting /', async function (assert) {
    await visit('/');

    await waitForSource('store');

    assert.strictEqual(currentURL(), '/');
  });
});
