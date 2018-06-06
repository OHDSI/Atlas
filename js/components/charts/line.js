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
    static get name() {
      return 'atlasline';
    }

    constructor(params) {
      super(params);
      this.renderer = new atlascharts.line();
    }
  }

  return Component.build(Line);
});
