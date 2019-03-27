define([
	'knockout',
	'text!./estimation-browser.html',
	'appConfig',
	'./const',
	'services/MomentAPI',
	'./PermissionService',
	'pages/Page',
	'utils/CommonUtils',
    'utils/DatatableUtils',
	'services/Estimation',
	'services/AuthAPI',
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
	commonUtils,
	datatableUtils,
	EstimationService,
	authAPI
) {
  class EstimationBrowser extends Page {
		constructor(params) {
			super(params);
			this.model = params.model;
			this.reference = ko.observableArray();
			this.loading = ko.observable(false);
			this.config = config;

			this.canReadEstimations = PermissionService.isPermittedList;
			this.canCreateEstimation = PermissionService.isPermittedCreate;

			this.isAuthenticated = authAPI.isAuthenticated;
			this.hasAccess = authAPI.isPermittedReadEstimations;

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
					data: 'estimationId'
				},
				{
					title: 'Type',
                    data: d => d.type,
                    visible: false,
				},
				{
					title: 'Name',
					render: datatableUtils.getLinkFormatter(d => ({
						link: constants.paths.ccaAnalysis(d.estimationId),
						label: d['name']
					})),
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
		}

		onPageCreated() {
			if (this.canReadEstimations()) {
				this.loading(true);
				EstimationService.getEstimationList()
					.then(({data}) => {
						this.loading(false);
						this.reference(data);
					});
			}
		}

		newEstimation() {
			document.location = constants.paths.createCcaAnalysis();
		}
	}

	return commonUtils.build('estimation-browser', EstimationBrowser, view);
});