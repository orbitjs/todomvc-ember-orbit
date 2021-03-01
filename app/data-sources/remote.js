import SourceClass from '@orbit/jsonapi';

export default {
  create(injections = {}) {
    injections.name = 'remote';
    return new SourceClass(injections);
  }
};
