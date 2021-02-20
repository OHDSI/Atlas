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
						'caption': 'Created',
						'binding': (o) => datatableUtils.getFacetForDate(o.createdDate)
					},
					{
						'caption': 'Updated',
						'binding': (o) => datatableUtils.getFacetForDate(o.modifiedDate)
					},
					{
						'caption': 'Author',
						'binding': datatableUtils.getFacetForCreatedBy,
					},
					{
						'caption': 'Designs',
						'binding': datatableUtils.getFacetForDesign,
					},
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