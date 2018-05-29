define([
	'knockout',
  'text!./treemap.html',
  'providers/Component',
  'pages/data-sources/classes/Treemap',
  'pages/data-sources/const',
  'components/heading',
  'components/charts/treemap',
  'pages/data-sources/components/reports/treemapDrilldown',
], function (
	ko,
  view,
  Component,
  TreemapReport,
  helpers
) {
	class ConditionEra extends TreemapReport {
    static get name() {
      return 'condition-era';
    }

    static get view() {
      return view;
    }

    constructor(params) {
      super(params);
       

      this.aggProperty = helpers.aggProperties.byLengthOfEra;
    }

  }

  return Component.build(ConditionEra)
});
