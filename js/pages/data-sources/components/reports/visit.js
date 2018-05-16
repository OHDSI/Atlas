define([
	'knockout',
	'text!./visit.html',
  'pages/data-sources/classes/Treemap',
  'components/heading',
  'components/charts/treemap',
  'pages/data-sources/components/reports/treemapDrilldown',
], function (
	ko,
	view,
  TreemapReport
) {
	class Visit extends TreemapReport {
    constructor() {
      super();
      this.name = 'visit';
      this.view = view;
      this.currentReport = {};
    }

    render(params) {
      super.render(params);
      this.aggProperty = params.report().aggProperty;
      // to pass down to drilldown
      this.currentReport = params.report;
      return this;
    }
  }

  const report = new Visit();	
	return report.build();
});
