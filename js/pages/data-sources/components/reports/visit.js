define([
	'knockout',
	'text!./visit.html',
  'pages/data-sources/classes/Treemap',
  'pages/data-sources/components/report-title',
  'pages/data-sources/components/charts/treemap',
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
    }

    selectTab(tabName) {

    }

    onReportTableRowClick(event) {

    }

    render(params) {
      super.render(params);
      this.aggProperty = params.report().aggProperty;
      
      this.getData()
        .then(({ data }) => {
          
        });

      return this;
    }
  }

  const report = new Visit();	
	return report.build();
});
