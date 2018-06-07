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
  helpers,
) {
  class Treemap extends Chart {
    constructor(params) {
      super(params);
      this.renderer = new atlascharts.treemap();
      this.storeParams(params);
      if (params.data()) {
        const hierarchy = helpers.buildHierarchyFromJSON(params.data(), this.threshold, params.aggProperty)
        this.rawData(hierarchy);
      }
    }

    storeParams(params) {
      super.storeParams(params);
      const width = this.width || this.minHeight;
      this.threshold = params.format.minimumArea / (width * this.minHeight);
    }

  }

  return helpers.build(Treemap, 'treemap', view);
});
