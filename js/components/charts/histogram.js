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
  class Histogram extends Chart {
    constructor(params) {
      super(params);
      this.renderer = new atlascharts.histogram();
    }

  }

  return commonUtils.build(Histogram, 'histogram', view);
});
