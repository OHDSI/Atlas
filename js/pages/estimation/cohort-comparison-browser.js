define([
	'knockout',
	'text!./cohort-comparison-browser.html',
	'appConfig',
	'./const',
	'utils/DatatableUtils',
	'services/MomentAPI',
	'services/AuthAPI',
	'pages/Page',
	'utils/CommonUtils',
	'services/http',
	'components/cohortcomparison/ComparativeCohortAnalysis',
	'faceted-datatable',
	'components/ac-access-denied',
	'components/heading',
	'components/empty-state',
	'less!./cohort-comparison-browser.less'
], function(
	ko,
	view,
	config,
	constants,
	datatableUtils,
	momentApi,
	authApi,
	Page,
	commonUtils,
	httpService,
) {
  class CohortComparisonBrowser extends Page {
		constructor(params) {
			super(params);
			this.model = params.model;
			this.reference = ko.observableArray();
			this.loading = ko.observable(true);
			this.config = config;

			this.canReadEstimations = ko.pureComputed(() => {
				return (config.userAuthenticationEnabled && authApi.isAuthenticated() && authApi.isPermittedReadEstimations()) || !config.userAuthenticationEnabled;
			});
			this.canCreateEstimation = ko.pureComputed(() => {
				return (config.userAuthenticationEnabled && authApi.isAuthenticated() && authApi.isPermittedCreateEstimation()) || !config.userAuthenticationEnabled;
			});

			this.options = {
				Facets: [
                    {
                        'caption': 'Created',
                        'binding': (o) => datatableUtils.getFacetForDate(o.createdDate)
                    },
                    {
                        'caption': 'Updated',
                        'binding': (o) => datatableUtils.getFacetForDate(o.modifiedDate)
                    },
                    {
                        'caption': 'Author',
                        'binding': datatableUtils.getFacetForCreatedBy,
                    },
				]
			};
			
			this.columns = [
				{
					title: 'Id',
					data: 'analysisId'
				},
				{
					title: 'Name',
					render: datatableUtils.getLinkFormatter(d => ({
						link: constants.singleAnalysisPaths.ccaAnalysis(d.analysisId),
						label: d['name']
					})),
				},
				{
					title: 'Created',
					type: 'date',
					render: function (s, p, d) {
						return momentApi.formatDateTimeUTC(d.createdDate);
					}
				},
				{
					title: 'Modified',
					type: 'date',
					render: function (s, p, d) {
						return momentApi.formatDateTimeUTC(d.modifiedDate);
					}
				},
				{
					title: 'Author',
					data: 'createdBy'
				}
			];
		}

		onPageCreated() {
			httpService.doGet(config.api.url + 'comparativecohortanalysis')
				.then(({ data }) => {
					this.loading(false);
					this.reference(data);
				})
				.catch(authApi.handleAccessDenied);
		}

		newCohortComparison() {
			document.location = constants.singleAnalysisPaths.createCcaAnalysis();
		}

		goToMultiAnalysisEstimation() {
			document.location = constants.multiAnalysisPaths.browser();
		}
	}

	return commonUtils.build('cohort-comparison-browser', CohortComparisonBrowser, view);
});