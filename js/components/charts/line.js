define([
	'knockout',
  'providers/Chart',
  'providers/Component',
  'atlascharts',
], function (
  ko,
  Chart,
  Component,
  atlascharts,
) {
  class Line extends Chart {
    constructor() {
      super();
      this.name = 'atlasline';
      this.chart = new atlascharts.line();
    }

    createViewModel(params) {
      super.createViewModel(params);
      return this;
    }
  }

  return Component.build(Line);
});
