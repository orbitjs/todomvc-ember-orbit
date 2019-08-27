import setupTest from "../helpers/setup-test";
import App from "../../src";

QUnit.module("todo", function(hooks) {
  const context = setupTest(App, hooks);

  QUnit.module("empty", function() {
    QUnit.test("findRecords", async function(assert) {
      let response = await context.request("/todos");

      assert.deepEqual(response.body, { data: [] });
    });

    QUnit.test("findRecord", async function(assert) {
      let response = await context.request("/todos/abc");

      assert.equal(response.status, 404);
    });
  });

  QUnit.module("with record", function(hooks) {
    hooks.beforeEach(async function() {
      await context.request("/todos", {
        method: "POST",
        payload: {
          data: {
            type: "todos",
            id: "abc",
            attributes: {
              title: "abc",
              completed: false
            }
          }
        }
      });
    });

    QUnit.test("findRecords", async function(assert) {
      let response = await context.request("/todos");

      assert.deepEqual(response.body, {
        data: [
          {
            type: "todos",
            id: "abc",
            attributes: {
              title: "abc",
              completed: false
            }
          }
        ]
      });
    });

    QUnit.test("findRecord", async function(assert) {
      let response = await context.request("/todos/abc");

      assert.deepEqual(response.body, {
        data: {
          type: "todos",
          id: "abc",
          attributes: {
            title: "abc",
            completed: false
          }
        }
      });
    });
  });
});
