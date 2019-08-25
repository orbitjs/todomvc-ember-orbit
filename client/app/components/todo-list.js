import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { set, action } from '@ember/object';

export default class extends Component {
	@tracked canToggle;

	get allCompleted() {
		return this.args.todos.isEvery('completed');
	}

	@action enableToggle() {
		this.canToggle = true;
	}

	@action disableToggle() {
		this.canToggle = false;
	}

	@action toggleAll() {
		for (let todo of this.args.todos) {
			set(todo, 'completed', !this.allCompleted);
		}
	}
}
