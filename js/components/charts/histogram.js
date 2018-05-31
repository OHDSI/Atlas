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
  class Histogram extends Chart {
    static get name() {
      return 'histogram';
    }

    constructor(params) {
      super(params);
      this.chart = new atlascharts.histogram();
    }

  }

  return Component.build(Histogram);
});
