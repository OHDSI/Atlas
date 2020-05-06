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
						'caption': ko.i18n('facets.caption.lastModified', 'Last Modified'),
						'binding': function (o) {
							var daysSinceModification = (new Date().getTime() - new Date(o.modifiedDate || o.createdDate).getTime()) / 1000 / 60 / 60 / 24;
							if (daysSinceModification < 7) {
								return ko.i18n('facets.date.thisWeek', 'This Week');
							} else if (daysSinceModification < 14) {
								return ko.i18n('facets.date.lastWeek', 'Last Week');
							} else {
								return ko.i18n('facets.date.other', '2+ Weeks Ago');
							}
						}
					},
					{
						'caption': ko.i18n('facets.caption.author', 'Author'),
						'binding': function (o) {
							return o.createdBy;
						}
					}
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