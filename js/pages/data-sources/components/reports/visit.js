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
	class Visit extends TreemapReport {
    constructor() {
      super();
      this.name = 'visit';
      this.view = view;
      this.currentReport = {};
      
      this.aggProperty = helpers.aggProperties.byPerson;
    }

    createViewModel(params) {
      super.createViewModel(params);
      return this;
    }
  }

  const report = new Visit();	
	return report.build();
});
