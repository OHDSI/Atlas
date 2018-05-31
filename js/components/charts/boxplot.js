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
  class Boxplot extends Chart {
    static get name() {
      return 'boxplot';
    }

    constructor(params) {
      super(params);
      this.chart = new atlascharts.boxplot();
    }

  }

	return Component.build(Boxplot);
});
