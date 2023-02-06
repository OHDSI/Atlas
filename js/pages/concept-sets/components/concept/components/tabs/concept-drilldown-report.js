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
			this.hasRCAccess = ko.computed(() => this.hasInfoAccess() && PermissionService.isPermittedGetRC(sharedState.sourceKeyOfVocabUrl()));
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
			this.subscriptions.push(this.currentSource.subscribe(r => {
				if (r) {
					this.loadRecordCounts()
				}
			}));

			this.loadRecordCounts();
		}

		async fetchRecordCounts(sources) {
			const promises = [];
			const sourceData = [];
			for (const source of sources) {
				const { sourceName, sourceKey, resultsUrl } = source;
				if (authApi.hasSourceAccess(sourceKey)) {
					// await is harmless here since it will pull data sequentially while it can be done in parallel
					let promise = httpService.doPost(`${resultsUrl}conceptRecordCount`, [this.currentConceptId()]).then(({ data }) => {
						const recordCountObject = data.length > 0 ? Object.values(data[0])[0] : null;
						if (recordCountObject) {

							sourceData.push({
								sourceName,
								recordCount: recordCountObject[0],
								descendantRecordCount: recordCountObject[1]
							});
						}

					}).catch(err => {
						const failedMsg = ko.i18n('cs.manager.concept.tabs.recordCounts.failedToLoadData', 'Failed to load data');
						sourceData.push({
							sourceName,
							recordCount: failedMsg,
							descendantRecordCount: failedMsg,
						});
					});
					promises.push(promise);
				}
			}
			
			// Promise.allSettled works since Chrome v76 so we need polyfill for it
			await Promise.allSettled(promises);
			return sourceData;
		}

		async loadRecordCounts() {
			this.isLoading(true);
			try {

				const sourcesWithResults = sharedState.sources().filter(source => source.hasResults);

				const sourceData = await this.fetchRecordCounts(sourcesWithResults);

				this.sourceCounts(sourceData);
			} finally {
				this.isLoading(false);
			}
		}

		setCurrentReport(concept, reports) {
			const conceptDomain = concept.DOMAIN_ID.toLowerCase();
			const currentReport = reports.find(report => report.path === conceptDomain);
			return currentReport;
		}
	}

	return commonUtils.build('concept-drilldown-report', ConceptDrilldownReport, view);
});
