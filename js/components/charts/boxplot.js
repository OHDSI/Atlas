define([
	'knockout',
  'providers/Chart',
  'providers/Component',  
  'atlascharts',
  'text!components/charts/chart.html',
  'utils/CommonUtils'
], function (
  ko,
  Chart,
  Component,
  atlascharts,
  view,
  commonUtils
) {
  class Boxplot extends Chart {
    constructor(params) {
      super(params);
      this.renderer = new atlascharts.boxplot();
    }

  }

	return commonUtils.build(Boxplot, 'boxplot', view);
});
