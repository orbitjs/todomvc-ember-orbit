import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { isBlank } from '@ember/utils';

export default class extends Component {
  @tracked editing = false;

  @action startEditing() {
    this.args.onStartEdit();
    this.editing = true;
  }

  @action async doneEditing(e) {
    const title = e.target.value.trim();
    if (!this.editing) {
      return;
    }
    if (isBlank(title)) {
      await this.args.todo.$remove();
    } else {
      await this.args.todo.$replaceAttribute('title', title);
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

  @action async toggleCompleted(e) {
    await this.args.todo.$replaceAttribute('completed', e.target.checked);
  }

  @action removeTodo() {
    this.args.todo.$remove();
  }

  @action setEditFocus(element) {
    element.focus();
  }
}
