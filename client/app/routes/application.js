import { inject as service } from "@ember/service";
import { action } from "@ember/object";
import Route from "@ember/routing/route";

export default class extends Route {
  @service store;
  @service dataCoordinator;

  async beforeModel() {
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
}
