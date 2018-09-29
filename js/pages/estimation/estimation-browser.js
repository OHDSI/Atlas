define([
	'knockout',
	'text!./estimation-browser.html',
	'appConfig',
	'./const',
	'webapi/MomentAPI',
	'webapi/AuthAPI',
	'providers/Page',
	'providers/AutoBind',
	'utils/CommonUtils',
	'services/Estimation',
	'components/cohortcomparison/ComparativeCohortAnalysis',
	'faceted-datatable',
	'components/ac-access-denied',
	'components/heading',
	'components/empty-state',
	'less!./estimation-browser.less'
], function(
	ko,
	view,
	config,
	constants,
	momentApi,
	authApi,
	Page,
	AutoBind,
	commonUtils,
	EstimationService,
) {
  class EstimationBrowser extends AutoBind(Page) {
		constructor(params) {
			super(params);
			this.model = params.model;
			this.reference = ko.observableArray();
			this.loading = ko.observable(true);

			this.canReadEstimations = ko.pureComputed(() => {
				return (config.userAuthenticationEnabled && authApi.isAuthenticated() && authApi.isPermittedReadEstimations()) || !config.userAuthenticationEnabled;
			});
			this.canCreateEstimation = ko.pureComputed(() => {
				return (config.userAuthenticationEnabled && authApi.isAuthenticated() && authApi.isPermittedCreateEstimation()) || !config.userAuthenticationEnabled;
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
					data: 'estimationId'
				},
				{
					title: 'Type',
                    data: d => d.type,
                    visible: false,
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
			
			EstimationService.getEstimationList()
				.then(({ data }) => {
					this.loading(false);
					this.reference(data);
				})
				.catch(authApi.handleAccessDenied);
		}

		rowClick(d) {
			document.location = constants.apiPaths.ccaAnalysis(d.estimationId);
		}

		newEstimation() {
			document.location = constants.apiPaths.createCcaAnalysis();
		}
	}

	return commonUtils.build('estimation-browser', EstimationBrowser, view);
});