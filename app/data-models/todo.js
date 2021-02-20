import { Model, attr } from 'ember-orbit';

export default class Todo extends Model {
  @attr('string') title;
  @attr('boolean') completed;
}
