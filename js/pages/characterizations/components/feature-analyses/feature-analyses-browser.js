define([
	'knockout',
	'pages/characterizations/services/FeatureAnalysisService',
	'text!./feature-analyses-browser.html',
	'components/entity-browser',
	'utils/CommonUtils',
	'utils/DatatableUtils',
	'./const',
	'less!./feature-analyses-browser.less',
], function (
	ko,
	FeatureAnalysisService,
	view,
	EntityBrowser,
	commonUtils,
	datatableUtils,
	feConst,
) {
	class FeatureAnalysesBrowser extends EntityBrowser {
		constructor(params) {
			super(params);

			this.options = {
				Facets: feConst.FeatureAnalysisFacets,
			};

			this.tableOptions = params.tableOptions || commonUtils.getTableOptions('M');

			this.columns = [
				...this.columns,
				{
					title: ko.i18n('columns.id', 'ID'),
					data: 'id'
				},
				{
					title: ko.i18n('columns.name', 'Name'),
					render: datatableUtils.getLinkFormatter(d => ({label: d['name']})),
				},
				{
					title: ko.i18n('columns.description', 'Description'),
					data: 'description'
				},
				{
					title: ko.i18n('columns.supportsAnnual', 'Supports Annual'),
					render: (s, p, d) => ko.unwrap(d.supportsAnnual ? ko.i18n('options.yes', 'Yes') : ko.i18n('options.no', 'No')),
				},
				{
					title: ko.i18n('columns.supportsTemporal', 'Supports Temporal'),
					render: (s, p, d) => ko.unwrap(d.supportsTemporal ? ko.i18n('options.yes', 'Yes') : ko.i18n('options.no', 'No')),
				}
			];
		}

		async loadData() {
			try {
				this.isLoading(true);
				const { content } = await FeatureAnalysisService.loadFeatureAnalysisList();
				this.data(content.map(item => ({ selected: ko.observable(this.selectedDataIds.includes(item.id)), ...item })));
			} catch(err) {
				console.error(err);
			} finally {
				this.isLoading(false);
			}
		}

	}

	return commonUtils.build('feature-analyses-browser', FeatureAnalysesBrowser, view);
});
