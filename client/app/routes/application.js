import { inject as service } from "@ember/service";
import { action } from "@ember/object";
import Route from "@ember/routing/route";

export default class extends Route {
  @service store;
  @service dataCoordinator;

  async beforeModel() {
    await this.dataCoordinator.activate();
    await this.store.query(q => q.findRecords("todo"));
  }
}
