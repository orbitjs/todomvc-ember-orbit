import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { isBlank } from '@ember/utils';
import { inject as service } from '@ember/service';

export default class extends Component {
  @service store;
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
      await this.store.removeRecord(this.args.todo);
    } else {
      await this.store.update((t) =>
        t.replaceAttribute(this.args.todo, 'title', title)
      );
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
    await this.store.update((t) =>
      t.replaceAttribute(this.args.todo, 'completed', e.target.checked)
    );
  }

  @action async removeTodo() {
    await this.store.removeRecord(this.args.todo);
  }

  @action setEditFocus(element) {
    element.focus();
  }
}
