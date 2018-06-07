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
	class Measurement extends TreemapReport {
    constructor(params) {
      super(params);       
      
      this.aggProperty = helpers.aggProperties.byPerson;
      this.byFrequency = true;
      this.byUnit = true;
      this.byType = true;
      this.byValueAsConcept = true;
      this.byOperator = true;
    }

  }

  return globalHelpers.build(Measurement, 'measurement', view);
});
