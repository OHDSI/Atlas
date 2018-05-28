define([
	'knockout',
	'text!./treemap.html',
  'pages/data-sources/classes/Treemap',
  'pages/data-sources/const',
  'components/heading',
  'components/charts/treemap',
  'pages/data-sources/components/reports/treemapDrilldown',
], function (
	ko,
	view,
  TreemapReport,
  helpers
) {
	class Condition extends TreemapReport {
    constructor() {
      super();
      this.name = 'condition';
      this.view = view;
      this.currentReport = {};

      this.aggProperty = helpers.aggProperties.byPerson;
      this.byType = true;
    }

    render(params) {
      super.render(params);
      return this;
    }
  }

  const report = new Condition();	
	return report.build();
});
