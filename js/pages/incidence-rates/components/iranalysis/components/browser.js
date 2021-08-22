define([
	'knockout',
	'text!./browser.html',
	'components/Component',
	'utils/CommonUtils',
	'services/MomentAPI',
    'utils/DatatableUtils',
	'faceted-datatable'
], function (
	ko,
	view,
	Component,
	commonUtils,
	momentApi,
	datatableUtils,
) {

	class IRAnalysisBrowserModel extends Component {
		constructor(params) {
			super(params);
			this.analysisList = params.analysisList;
			this.tableOptions = params.tableOptions || commonUtils.getTableOptions('M');
			this.options = params.options;
			this.columns = params.columns;

			this.rowClick = this.rowClick.bind(this);
		}

		rowClick (d) {
			this.selected(d.id);
		}
	}

	return commonUtils.build('ir-analysis-browser', IRAnalysisBrowserModel, view);
});