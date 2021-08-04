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
			this.options = {
				Facets: [
					{
						'caption': ko.i18n('facets.caption.created', 'Created'),
						'binding': (o) => datatableUtils.getFacetForDate(o.createdDate)
					},
					{
						'caption': ko.i18n('facets.caption.updated', 'Updated'),
						'binding': (o) => datatableUtils.getFacetForDate(o.modifiedDate)
					},
					{
						'caption': ko.i18n('facets.caption.author', 'Author'),
						'binding': datatableUtils.getFacetForCreatedBy,
					},
					{
						'caption': ko.i18n('facets.caption.designs', 'Designs'),
						'binding': datatableUtils.getFacetForDesign,
					},
				]
			};

			this.columns = [
				{
					title: ko.i18n('columns.id', 'Id'),
					data: 'id'
				},
				{
					title: ko.i18n('columns.name', 'Name'),
					render: datatableUtils.getLinkFormatter(d => ({
						label: d['name'],
						linkish: true,
					})),
				},
				{
					title: ko.i18n('columns.created', 'Created'),
					render: datatableUtils.getDateFieldFormatter('createdDate'),
				},
				{
					title: ko.i18n('columns.updated', 'Updated'),
					render: datatableUtils.getDateFieldFormatter('modifiedDate'),
				},
				{
					title: ko.i18n('columns.author', 'Author'),
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