define([
	'knockout',
  'providers/Chart',
  'providers/Component',
  'atlascharts',
  'text!components/charts/chart.html',
  'const'
], function (
  ko,
  Chart,
  Component,
  atlascharts,
  view,
  helpers
) {
  class Histogram extends Chart {
    constructor(params) {
      super(params);
      this.renderer = new atlascharts.histogram();
    }

  }

  return helpers.build(Histogram, 'histogram', view);
});
