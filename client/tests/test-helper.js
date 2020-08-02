import Application from 'todomvc-ember-orbit-client/app';
import config from 'todomvc-ember-orbit-client/config/environment';
import { setApplication } from '@ember/test-helpers';
import { start } from 'ember-qunit';

setApplication(Application.create(config.APP));

start();
