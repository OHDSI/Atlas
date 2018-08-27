define([
	'knockout',
	'atlas-state',
	'text!./data-sources.html',
	'appConfig',
	'webapi/AuthAPI',
	'providers/Component',
	'utils/CommonUtils',
	'databindings',
	'./components/reports/person',
	'./components/reports/dashboard',
	'./components/reports/datadensity',
	'./components/reports/person',
	'./components/reports/visit',
	'./components/reports/condition',
	'./components/reports/conditionEra',
	'./components/reports/procedure',
	'./components/reports/drug',
	'./components/reports/drugEra',
	'./components/reports/measurement',
	'./components/reports/observation',
	'./components/reports/death',
	'./components/reports/achillesHeel',
	'less!./data-sources.less'
], function (
	ko,
	sharedState,
	view,
	config,
	authApi,
	Component,
	commonUtils
) {
	class DataSources extends Component {
		constructor(params) {
			super();

			this.reports = [
				{
					name: "Dashboard",
					path: "dashboard",
					component: "report-dashboard",
					summary: ko.observable()
				},
				{
					name: "Data Density",
					path: "datadensity",
					component: "report-datadensity",
				},
				{
					name: "Person",
					path: "person",
					component: "report-person",
				},
				{
					name: "Visit",
					path: "visit",
					component: "report-visit",
				},
				{
					name: "Condition",
					path: "condition",
					component: "report-condition",
				},
				{
					name: "Condition Era",
					path: "conditionera",
					component: "report-condition-era",
				},
				{
					name: "Procedure",
					path: "procedure",
					component: "report-procedure",
				},
				{
					name: "Drug",
					path: "drug",
					component: "report-drug",
				},
				{
					name: "Drug Era",
					path: "drugera",
					component: "report-drug-era",
				},
				{
					name: "Measurement",
					path: "measurement",
					component: "report-measurement",
				},
				{
					name: "Observation",
					path: "observation",
					component: "report-observation",
				},
				{
					name: "Death",
					path: "death",
					component: "report-death",
				},
				{
					name: "Achilles Heel",
					path: "achillesheel",
					component: "report-achilles-heel",
				},
			];

			this.model = params.model;
			this.sources = ko.computed(() => {
				return sharedState.sources().filter(function (s) {
					return s.hasResults && s.hasCDM;
				});
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

			this.currentSource.subscribe(() => {
				this.currentReport.valueHasMutated();
			});
		}
	}

	return commonUtils.build('data-sources', DataSources, view);
});
