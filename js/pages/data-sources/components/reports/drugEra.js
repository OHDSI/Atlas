define([
	'knockout',
	'text!./treemap.html',
  'pages/data-sources/classes/Treemap',
  'providers/Component',
  'pages/data-sources/const',
  'const',
  'components/heading',
  'components/charts/treemap',
  'pages/data-sources/components/reports/treemapDrilldown',
], function (
	ko,
	view,
  TreemapReport,
  Component,
  helpers,
  globalHelpers
) {
	class DrugEra extends TreemapReport {
    constructor(params) {
      super(params);

      this.aggProperty = helpers.aggProperties.byLengthOfEra;
    }

  }

  return globalHelpers.build(DrugEra, 'drug-era', view);
});
