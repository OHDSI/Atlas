define([
	'knockout',
	'pages/characterizations/services/FeatureAnalysisService',
	'text!./feature-analyses-browser.html',
	'components/entity-browser',
	'utils/CommonUtils',
	'utils/DatatableUtils',
	'utils/Renderers',
	'./const',
	'less!./feature-analyses-browser.less',
], function (
	ko,
	FeatureAnalysisService,
	view,
	EntityBrowser,
	commonUtils,
	datatableUtils,
	renderers,
	feConst,
) {
	class FeatureAnalysesBrowser extends EntityBrowser {
		constructor(params) {
			super(params);

			this.options = {
				Facets: feConst.FeatureAnalysisFacets,
			};

			this.tableDom = "Bfiprt<'page-size'l>ip";

			this.columns = [
				{
					title: 'ID',
					data: 'id'
				},
				{
					title: 'Name',
					render: datatableUtils.getLinkFormatter(d => ({label: d['name']})),
				},
				{
					title: 'Description',
					data: 'description'
				}
			];

			if (!!this.multiChoice) {
				this.columns = [
					{
						data: 'selected',
						class: this.classes({extra: 'text-center'}),
						render: () => renderers.renderCheckbox('selected'),
						searchable: false,
						orderable: false,
					},
					...this.columns,
				]
			}
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
