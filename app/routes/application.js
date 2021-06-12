import { inject as service } from '@ember/service';
import Route from '@ember/routing/route';

export default class extends Route {
  @service store;
  @service dataCoordinator;

  async beforeModel() {
    console.log('Sources:', this.dataCoordinator.sourceNames);

    // If a backup source is present, populate the store from backup prior to
    // activating the coordinator
    const backup = this.dataCoordinator.getSource('backup');
    if (backup) {
      const records = await backup.query((q) => q.findRecords());
      await this.store.sync((t) => records.map((r) => t.addRecord(r)));
    }

    await this.dataCoordinator.activate();
    await this.store.query((q) => q.findRecords('todo'));
  }
}
