define([
	'knockout',
	'text!./concept-drilldown-report.html',
	'components/Component',
	'utils/CommonUtils',
	'atlas-state',
	'services/http',
	'services/AuthAPI',
	'pages/concept-sets/PermissionService',
	'components/reports/const',
	'components/reports/reportDrilldown'
], function (
	ko,
	view,
	Component,
	commonUtils,
	sharedState,
	httpService,
	authApi,
	PermissionService,
	constants
) {
	class ConceptDrilldownReport extends Component {
		constructor(params) {
			super(params);
			this.currentConceptId = params.currentConceptId;
			this.hasInfoAccess = params.hasInfoAccess;
			this.isAuthenticated = params.isAuthenticated;
			this.currentConcept = params.currentConcept;
			this.sourceCounts = ko.observableArray();
			this.isLoading = ko.observable(false);
			this.loadingReport = ko.observable(false);
			this.loadingDrilldownDone = ko.observable(false);
			this.showLoadingDrilldownModal = ko.observable(false);
			this.hasError = ko.observable(false);
			this.errorMessage = ko.observable();
			this.currentReport = ko.computed(() => this.setCurrentReport(this.currentConcept(), constants.reports));

			this.currentSource = ko.observable();
			this.sources = ko.computed(() => {
				const resultSources = [];
				sharedState.sources().forEach((source) => {
					if (source.hasResults && authApi.isPermittedAccessSource(source.sourceKey)) {
						resultSources.push(source);
						if (source.resultsUrl === sharedState.resultsUrl()) {
							this.currentSource(source);
						}
					}
				})

				return resultSources;
			});
		}

		setCurrentReport(concept, reports) {
			const conceptDomain = concept.DOMAIN_ID.toLowerCase();
			const currentReport = reports.find(report => report.path === conceptDomain);
			return currentReport;
		}
	}

	return commonUtils.build('concept-drilldown-report', ConceptDrilldownReport, view);
});
