define([
	'knockout',
	'text!./cohort-comparison-browser.html',
	'appConfig',
	'utils/MomentUtils',
	'services/AuthService',
	'services/permissions/EstimationPermissionService',
	'providers/Page',
	'providers/AutoBind',
	'utils/CommonUtils',
	'services/httpService',
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
	momentUtils,
	AuthService,
	EstimationPermissionService,
	Page,
	AutoBind,
	commonUtils,
	httpService,
) {
  class CohortComparisonBrowser extends AutoBind(Page) {
		constructor(params) {
			super(params);
			this.model = params.model;
			this.reference = ko.observableArray();
			this.loading = ko.observable(true);

			this.canReadEstimations = ko.pureComputed(() => {
				return (config.userAuthenticationEnabled && AuthService.isAuthenticated() && EstimationPermissionService.isPermittedReadEstimations()) || !config.userAuthenticationEnabled;
			});
			this.canCreateEstimation = ko.pureComputed(() => {
				return (config.userAuthenticationEnabled && AuthService.isAuthenticated() && EstimationPermissionService.isPermittedCreateEstimation()) || !config.userAuthenticationEnabled;
			});

			this.options = {
				Facets: [
					{
						'caption': 'Last Modified',
						'binding': function (o) {
							var daysSinceModification = (new Date().getTime() - new Date(o.modified).getTime()) / 1000 / 60 / 60 / 24;
							if (daysSinceModification < .01) {					
								return 'Just Now';
							} else if (daysSinceModification < 1) {					
								return 'Within 24 Hours';
							} else if (daysSinceModification < 7) {
								return 'This Week';
							} else if (daysSinceModification < 14) {
								return 'Last Week';
							} else {
								return '2+ Weeks Ago';
							}
						}
					}
				]
			};
			
			this.columns = [
				{
					title: 'Id',
					data: 'analysisId'
				},
				{
					title: 'Name',
					data: d => {
						return '<span class=\'linkish\'>' + d.name + '</span>';
					},
				},
				{
					title: 'Created',
					type: 'date',
					render: function (s, p, d) {
						return momentUtils.formatDateTimeUTC(d.createdDate);
					}
				},
				{
					title: 'Modified',
					type: 'date',
					render: function (s, p, d) {
						return momentUtils.formatDateTimeUTC(d.modifiedDate);
					}
				},
				{
					title: 'Author',
					data: 'createdBy'
				}
			];
			
			httpService.doGet(config.api.url + 'comparativecohortanalysis')
				.then(({ data }) => {
					this.loading(false);
					this.reference(data);
				})
				.catch(AuthService.handleAccessDenied);
		}

		rowClick(d) {
			document.location = '#/estimation/' + d.analysisId;
		}

		newCohortComparison() {
			document.location = '#/estimation/0';
		}
	}

	return commonUtils.build('cohort-comparison-browser', CohortComparisonBrowser, view);
});