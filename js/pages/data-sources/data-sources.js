define([
	'knockout',
	'atlas-state',
	'text!./data-sources.html',
	'appConfig',
	'webapi/AuthAPI',
	'providers/Component',
	'databindings',
	'./components/reports/person',	
	'less!./data-sources.less'
], function (
	ko,
	sharedState,
	view,
	config,
	authApi,
	Component
) {
	class DataSources extends Component {
		static get name() {
			return 'data-sources';
		}

		static get view() {
			return view;
		}

		constructor(params) {
			super();

			this.reports = [
				{
					name: "Dashboard",
					path: "dashboard",
					summary: ko.observable()
				},
				{
					name: "Data Density",
					path: "datadensity",
				},
				{
					name: "Person",
					path: "person",
				},
				{
					name: "Visit",
					path: "visit",
				},
				{
					name: "Condition",
					path: "condition",
				},
				{
					name: "Condition Era",
					path: "conditionera",
				},
				{
					name: "Procedure",
					path: "procedure",
				},
				{
					name: "Drug",
					path: "drug",
				},
				{
					name: "Drug Era",
					path: "drugera",
				},
				{
					name: "Measurement",
					path: "measurement",
				},
				{
					name: "Observation",
					path: "observation",
				},
				{
					name: "Death",
					path: "death",
				},
				{
					name: "Achilles Heel",
					path: "achillesheel",
				},
			];

			this.model = params.model;
			this.sources = sharedState.sources().filter(function (s) {
				return s.hasResults && s.hasCDM;
			});
			this.loadingReport = ko.observable(false);
			this.hasError = ko.observable(false);

			this.isAuthenticated = authApi.isAuthenticated;
			this.canViewCdmResults = ko.pureComputed(() => {
				return (config.userAuthenticationEnabled && this.isAuthenticated() && authApi.isPermittedViewCdmResults()) || !config.userAuthenticationEnabled;
			});

			this.showSelectionArea = params.showSelectionArea == undefined ? true : params.showSelectionArea;
			this.currentSource = ko.observable(this.sources[0]);
			this.currentReport = ko.observable();
			this.currentConcept = ko.observable();
		}
	}

	return Component.build(DataSources);
});
