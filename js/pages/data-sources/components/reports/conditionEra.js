define([
	'knockout',
  'text!./treemap.html',
  'providers/Component',
  'pages/data-sources/classes/Treemap',
  'pages/data-sources/const',
  'const',
  'components/heading',
  'components/charts/treemap',
  'pages/data-sources/components/reports/treemapDrilldown',
], function (
	ko,
  view,
  Component,
  TreemapReport,
  helpers,
  globalHelpers
) {
	class ConditionEra extends TreemapReport {
    constructor(params) {
      super(params);

      this.aggProperty = helpers.aggProperties.byLengthOfEra;
    }

  }

  return globalHelpers.build(ConditionEra, 'condition-era', view);
});
