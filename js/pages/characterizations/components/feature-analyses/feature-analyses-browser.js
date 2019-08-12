define([
	'knockout',
	'pages/characterizations/services/FeatureAnalysisService',
	'text!./feature-analyses-browser.html',
	'appConfig',
	'services/AuthAPI',
	'components/Component',
	'utils/AutoBind',
	'utils/CommonUtils',
	'utils/DatatableUtils',
	'utils/Renderers',
	'./const',
	'pages/characterizations/const',
	'../tabbed-grid',
	'less!./feature-analyses-browser.less',
], function (
	ko,
	FeatureAnalysisService,
	view,
	config,
	authApi,
	Component,
	AutoBind,
	commonUtils,
	datatableUtils,
	renderers,
	feConst,
) {
	class FeatureAnalysesBrowser extends AutoBind(Component) {
		constructor(params) {
			super();

			this.selectedAnalyses = params.selectedAnalyses;
			this.scrollY = params.scrollY;
			this.scrollCollapse = params.scrollCollapse;

			this.data = ko.observableArray();
			this.loading = ko.observable(false);
			this.config = config;
			this.selectedData = ko.observableArray([]);
			this.options = {
				Facets: feConst.FeatureAnalysisFacets,
			};

			this.tableDom = "Bfiprt<'page-size'l>ip";

			this.columns = [
				{
					data: 'selected',
					class: this.classes({extra: 'text-center'}),
					render: () => renderers.renderCheckbox('selected'),
					searchable: false,
					orderable: false,
				},
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

			this.buttons = [
				{
					text: 'Select All', action: () => this.toggleSelected(true), className: this.classes({extra: 'btn btn-sm btn-success'}),
					init: this.removeClass('dt-button')
				},
				{
					text: 'Deselect All', action: () => this.toggleSelected(false), className: this.classes({extra: 'btn btn-sm btn-primary'}),
					init: this.removeClass('dt-button')
				}
			];

			this.loadData();
		}

		async loadData() {
			this.loading(true);
			const res = await FeatureAnalysisService.loadFeatureAnalysisList();
			this.data(res.content.map(item => ({...item, selected: this.getSelectedObservable()})));
			this.loading(false);
		}

		removeClass(className) {
			return (dt, node, cfg) => node.removeClass(className);
		}

		toggleSelected(selected) {
			if (this.data()){
				const selectedData = (ko.utils.unwrapObservable(this.selectedData) || []).map(i => i.id);
				this.data().forEach(i => selectedData.length === 0 ? i.selected(selected) : (selectedData.includes(i.id) && i.selected(selected)));
			}
		}

		getSelectedObservable() {
			const selector = ko.observable();
			selector.subscribe(() => this.selectedAnalyses(this.getSelectedAnalyses()));
			return selector;
		}

		getSelectedAnalyses() {
			return this.data().filter(i => i.selected()).map(item => {
				let {selected, ...result} = item;
				return result;
			});
		}
	}

	return commonUtils.build('feature-analyses-browser', FeatureAnalysesBrowser, view);
});
