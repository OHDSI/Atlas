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
  class Boxplot extends Chart {
    constructor(params) {
      super(params);
      this.renderer = new atlascharts.boxplot();
    }

  }

	return helpers.build(Boxplot, 'boxplot', view);
});
