define([
	'knockout',
	'text!./browser.html',
	'components/Component',
	'utils/CommonUtils',
	'utils/DatatableUtils',
	'services/IRAnalysis',
	'services/MomentAPI',
	'faceted-datatable'
], function (
	ko,
	view,
	Component,
	commonUtils,
	datatableUtils,
	IRAnalysisService,
	momentApi
) {
	
	class IRAnalysisBrowserModel extends Component {
		constructor(params) {
			super(params);
			this.analysisList = params.analysisList;

			this.options = {
				entityName: 'ir_analysis'
			};

			this.columns = [
				{
					title: 'Id',
					data: 'id'
				},
				{
					title: 'Name',
					data: "name",
					render: (s, p, d) => {
						return '<span class="linkish">' + d.name + '</span>';
					}
				},
				{
					title: 'Created',
					data: 'createdDate',
					type: 'date',
					render: function (s, p, d) {
						return momentApi.formatDateTimeUTC(d.createdDate);
					}
				},
				{
					title: 'Updated',
					data: 'modifiedDate',
					type: 'date',
					render: function (s, p, d) {
						return momentApi.formatDateTimeUTC(d.modifiedDate);
					}
				},
				{
					title: 'Author',
					data: 'createdBy'
				}
			];
			this.ajax = IRAnalysisService.getAnalysisList;

			this.rowClick = this.rowClick.bind(this);
		}
		
		rowClick (d) {
			this.selected(d.id);
		}
	}

	return commonUtils.build('ir-analysis-browser', IRAnalysisBrowserModel, view);
});