define([
	'knockout',
	'text!./estimation-browser.html',
	'appConfig',
	'./const',
	'services/MomentAPI',
	'./PermissionService',
	'pages/Page',
	'utils/AutoBind',
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
	PermissionService,
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
			this.loading = ko.observable(false);

			this.canReadEstimations = PermissionService.isPermittedList;
			this.canCreateEstimation = PermissionService.isPermittedCreate;

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
					type: 'datetime-formatted',
					render: function (s, p, d) {
						return momentApi.formatDateTimeUTC(d.createdDate);
					}
				},
				{
					title: 'Modified',
					type: 'datetime-formatted',
					render: function (s, p, d) {
						return momentApi.formatDateTimeUTC(d.modifiedDate);
					}
				},
				{
					title: 'Author',
					data: 'createdBy'
				}
			];

			if (this.canReadEstimations()) {
				this.loading(true);
				EstimationService.getEstimationList()
					.then(({data}) => {
						this.loading(false);
						this.reference(data);
					});
			}
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