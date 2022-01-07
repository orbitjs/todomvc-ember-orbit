'use strict';

module.exports = {
  extends: 'recommended',
  overrides: [
    {
      files: ['app/components/todo-item.hbs', 'app/components/todo-list.hbs'],
      rules: { 'require-input-label': false },
    },
  ],
};
