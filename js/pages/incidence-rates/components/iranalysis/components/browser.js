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

			this.options = {
				Facets: [
					{
						'caption': 'Last Modified',
						'binding': function (o) {
							var daysSinceModification = (new Date().getTime() - new Date(o.modifiedDate || o.createdDate).getTime()) / 1000 / 60 / 60 / 24;
							if (daysSinceModification < 7) {
								return 'This Week';
							} else if (daysSinceModification < 14) {
								return 'Last Week';
							} else {
								return '2+ Weeks Ago';
							}
						}
					},
					{
						'caption': 'Author',
						'binding': function (o) {
							return o.createdBy;
						}
					}
				]
			};

			this.columns = [
				{
					title: 'Id',
					data: 'id'
				},
				{
					title: 'Name',
					render: datatableUtils.getLinkFormatter(d => ({
						label: d['name'],
						linkish: true,
					})),
				},
				{
					title: 'Created',
					render: datatableUtils.getDateFieldFormatter('createdDate'),
				},
				{
					title: 'Updated',
					render: datatableUtils.getDateFieldFormatter('modifiedDate'),
				},
				{
					title: 'Author',
					render: datatableUtils.getCreatedByFormatter(),
				}
			];

			this.rowClick = this.rowClick.bind(this);
		}

		rowClick (d) {
			this.selected(d.id);
		}
	}

	return commonUtils.build('ir-analysis-browser', IRAnalysisBrowserModel, view);
});