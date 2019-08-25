import { inject as service } from '@ember/service';
import { action } from '@ember/object';
import { isBlank } from '@ember/utils';
import Route from '@ember/routing/route';

export default class extends Route {
	@service store;
	@service dataCoordinator;

	model() {
		return {
			all: this.allTodos,
			remaining: this.remainingTodos,
			completed: this.completedTodos,
			createTodo: this.createTodo,
			clearCompleted: this.clearCompleted
		};
	}

  async beforeModel() {
    // Populate the store from backup prior to activating the coordinator
    // const backup = this.dataCoordinator.getSource('backup');
    // const transform = await backup.pull(q => q.findRecords());
    // await this.store.sync(transform);

    await this.dataCoordinator.activate();
  }

	@action createTodo(e) {
		if (e.keyCode === 13 && !isBlank(e.target.value)) {
			this.store.addRecord({
				type: 'todo',
				title: e.target.value.trim(),
				completed: false
			});
			e.target.value = '';
		}
	}

	@action clearCompleted() {
		for (let todo of this.currentCompletedTodos) {
			todo.remove();
		}
	}

	get allTodos() {
		return this.store.cache.liveQuery(q => q.findRecords('todo').sort('id'));
	}

	get remainingTodos() {
		return this.store.cache.liveQuery(q => q.findRecords('todo').filter({ attribute: 'completed', value: false }).sort('id'));
	}

	get completedTodos() {
		return this.store.cache.liveQuery(q => q.findRecords('todo').filter({ attribute: 'completed', value: true }).sort('id'));
	}

	get currentCompletedTodos() {
		return this.store.cache.query(q => q.findRecords('todo').filter({ attribute: 'completed', value: true }));
	}
}
