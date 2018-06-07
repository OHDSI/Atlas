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
	class Condition extends TreemapReport {
    constructor(params) {
      super(params);       

      this.aggProperty = helpers.aggProperties.byPerson;
      this.byType = true;
    }

  }

  return globalHelpers.build(Condition, 'condition', view);
});
