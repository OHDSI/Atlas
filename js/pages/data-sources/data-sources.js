define([
	'knockout',
	'atlas-state',
	'text!./data-sources.html',
	'appConfig',
	'services/AuthAPI',
	'pages/Page',
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
	Page,
	commonUtils
) {
	class DataSources extends Page {
		constructor(params) {
			super(params);

			this.reports = [{
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
					name: "Condition Occurrence",
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
					name: "Drug Exposure",
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
			this.sources = ko.computed(() => sharedState.sources().filter(function (s) {
                return s.hasResults && s.hasVocabulary;
            }));

			this.loadingReport = ko.observable(false);
			this.hasError = ko.observable(false);
			this.errorMessage = ko.observable();

			this.isReportLoading = ko.pureComputed(function () {
				return this.loadingReport() && !this.hasError() && !this.model.loadingReportDrilldown();
			}, this);

			this.isAuthenticated = authApi.isAuthenticated;
			this.canViewCdmResults = ko.pureComputed(() => {
				return (config.userAuthenticationEnabled && this.isAuthenticated() && authApi.isPermittedViewCdmResults()) || !config.userAuthenticationEnabled;
			});

			this.showSelectionArea = params.showSelectionArea == undefined ? true : params.showSelectionArea;
			this.currentSource = ko.observable(this.sources()[0]);
			this.currentReport = ko.observable();
			this.selectedReport = ko.observable();

			this.currentSource.subscribe((source) => source && this.hasError(false));
			this.currentReport.subscribe((report) => report && this.hasError(false));

			this.selectedReportSubscription = this.selectedReport.subscribe(r => {
				this.updateLocation();
			});

			this.selectedSourceSubscription = this.currentSource.subscribe(r => {
				this.updateLocation();
			})

			this.currentConcept = ko.observable();
		}

		dispose() {
			this.selectedReportSubscription.dispose();
			this.selectedSourceSubscription.dispose();
		}

		updateLocation() {
			if (this.currentSource() && this.selectedReport()) {
				document.location = "#/datasources/" + this.currentSource().sourceKey + "/" + this.selectedReport().path;
			}
		}

		onRouterParamsChanged(changedParams, newParams) {
			if (newParams == null && changedParams == null)
				return;

			if (newParams == null) {
				// initial page load direct from URL
				this.currentSource(this.sources().find(s => s.sourceKey == changedParams.sourceKey));
				this.currentReport(this.reports.find(r => r.path == changedParams.reportName));
				this.selectedReport(this.reports.find(r => r.path == changedParams.reportName));
			} else {
				if (changedParams.sourceKey && this.currentSource() && changedParams.sourceKey !== this.currentSource().sourceKey) {
					this.currentSource(this.sources().find(s => s.sourceKey == newParams.sourceKey));
				}
				if (changedParams.reportName) {
					this.currentReport(this.reports.find(r => r.path == newParams.reportName));
					this.selectedReport(this.reports.find(r => r.path == newParams.reportName));
				}
			}
		}
	}

	return commonUtils.build('data-sources', DataSources, view);
});