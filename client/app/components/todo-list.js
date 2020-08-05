import Component from "@glimmer/component";
import { tracked } from "@glimmer/tracking";
import { action } from "@ember/object";
import { inject as service } from "@ember/service";
import { isBlank } from "@ember/utils";

export default class extends Component {
  @service store;
  @tracked canToggle = true;

  get allCompleted() {
    return this.remainingTodos.length === 0;
  }

  @action enableToggle() {
    this.canToggle = true;
  }

  @action disableToggle() {
    this.canToggle = false;
  }

  @action async toggleAll() {
    const completed = !this.allCompleted;
    const todos = completed ? this.remainingTodos : this.completedTodos;

    await this.store.update((t) =>
      todos.value.map((todo) => {
        return t.replaceAttribute(todo.identity, "completed", completed);
      })
    );
  }

  @action async createTodo(e) {
    if (e.keyCode === 13 && !isBlank(e.target.value)) {
      await this.store.addRecord({
        type: "todo",
        title: e.target.value.trim(),
        completed: false,
      });
      e.target.value = "";
    }
  }

  @action clearCompleted() {
    for (let todo of this.completedTodos) {
      todo.remove();
    }
  }

  @action setInitialFocus(element) {
    element.focus();
  }

  get todos() {
    switch (this.args.filter) {
      case "active":
        return this.remainingTodos;
      case "completed":
        return this.completedTodos;
      default:
        return this.allTodos;
    }
  }

  get allTodos() {
    return this.store.cache.liveQuery((q) =>
      q.findRecords("todo").sort("title")
    );
  }

  get remainingTodos() {
    return this.store.cache.liveQuery((q) =>
      q
        .findRecords("todo")
        .filter({ attribute: "completed", value: false })
        .sort("title")
    );
  }

  get completedTodos() {
    return this.store.cache.liveQuery((q) =>
      q
        .findRecords("todo")
        .filter({ attribute: "completed", value: true })
        .sort("title")
    );
  }
}
