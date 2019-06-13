define([
	'knockout',
	'text!./prediction-browser.html',
	'appConfig',
	'./const',
	'services/MomentAPI',
	'./PermissionService',
	'pages/Page',
	'utils/CommonUtils',
    'utils/DatatableUtils',
	'services/Prediction',
	'services/AuthAPI',
	'faceted-datatable',
	'components/ac-access-denied',
	'components/heading',
	'components/empty-state',
	'less!./prediction-browser.less'
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
	PredictionService,
	authAPI,
) {
  class PredictionBrowser extends Page {
		constructor(params) {
			super(params);
			this.model = params.model;
			this.reference = ko.observableArray();
			this.loading = ko.observable(false);
			this.config = config;

			this.canReadPredictions = PermissionService.isPermittedList;
			this.canCreatePrediction = PermissionService.isPermittedCreate;

			this.isAuthenticated = authAPI.isAuthenticated;
			this.hasAccess = authAPI.isPermittedReadPlps;

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
					data: 'id'
				},
				{
					title: 'Type',
                    data: d => d.type,
                    visible: false,
				},
				{
					title: 'Name',
					render: datatableUtils.getLinkFormatter(d => ({
						link: constants.paths.analysis(d.id),
						label: d['name']
					})),

				},
				{
					title: 'Created',
					render: datatableUtils.getDateFieldFormatter('createdDate'),
				},
				{
					title: 'Modified',
					render: datatableUtils.getDateFieldFormatter('modifiedDate'),
				},
				{
					title: 'Author',
					render: datatableUtils.getCreatedByFormatter(),
				}
			];
		}

		onPageCreated() {
			if (this.canReadPredictions()) {
				this.loading(true);
				PredictionService.getPredictionList()
					.then(({ data }) => {
						datatableUtils.coalesceField(data, 'modifiedDate', 'createdDate');
						this.loading(false);
						this.reference(data);
					});
			}
		}

		newPrediction() {
			document.location = constants.paths.createAnalysis();
		}
	}

	return commonUtils.build('prediction-browser', PredictionBrowser, view);
});