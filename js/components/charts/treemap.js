define([
	'knockout',
  'providers/Chart',
  'providers/Component',
  'atlascharts',
  'const',
], function (
  ko,
  Chart,
  Component,
  atlascharts,
  helpers,
) {
  class Treemap extends Chart {
    static get name() {
      return 'treemap';
    }
    
    constructor(params) {
      super(params);
      this.renderer = new atlascharts.treemap();
      this.storeParams(params);
      if (params.data()) {
        const hierarchy = helpers.buildHierarchyFromJSON(params.data(), this.threshold, params.aggProperty)
        this.data(hierarchy);
      }
    }

    storeParams(params) {
      super.storeParams(params);
      const width = this.width || this.minHeight;
      this.threshold = params.format.minimumArea / (width * this.minHeight);
    }

  }

  return Component.build(Treemap);
});
