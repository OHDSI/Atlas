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
  class Donut extends Chart {
    constructor(params) {
      super(params);
      this.renderer = new atlascharts.donut();
    }
  }

  return helpers.build(Donut, 'donut', view);
});
