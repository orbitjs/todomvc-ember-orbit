import Component from "@glimmer/component";
import { tracked } from "@glimmer/tracking";
import { set, action } from "@ember/object";
import { isBlank } from "@ember/utils";

export default class extends Component {
  @tracked editing = false;

  @action startEditing() {
    this.args.onStartEdit();
    this.editing = true;
  }

  @action doneEditing(e) {
    const title = e.target.value.trim();
    if (!this.editing) {
      return;
    }
    if (isBlank(title)) {
      this.args.todo.remove();
    } else {
      set(this.args.todo, "title", title);
      this.editing = false;
      this.args.onEndEdit();
    }
  }

  @action handleKeydown(e) {
    if (e.keyCode === 13) {
      e.target.blur();
    } else if (e.keyCode === 27) {
      this.editing = false;
    }
  }

  @action toggleCompleted(e) {
    set(this.args.todo, "completed", e.target.checked);
  }

  @action removeTodo() {
    this.args.todo.remove();
  }

  @action setEditFocus(element) {
    element.focus();
  }
}
