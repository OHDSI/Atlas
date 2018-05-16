define([
	'knockout',
  'providers/Chart',
  'atlascharts',
  'const',
], function (
  ko,
  Chart,
  atlascharts,
  helpers,
) {
  class Treemap extends Chart {
    constructor() {
      super();
      this.name = 'treemap';
      this.chart = new atlascharts.treemap();
    }

    storeParams(params) {
      super.storeParams(params);
      const width = this.width || this.minHeight;
      this.threshold = params.format.minimumArea / (width * this.minHeight);
    }

    render(params) {
      this.storeParams(params);
      const hierarchy = helpers.buildHierarchyFromJSON(params.data(), this.threshold, params.aggProperty)
      this.data(hierarchy);
      return this;
    }
  }

  const viewModel = new Treemap();  
	return viewModel.build();
});
