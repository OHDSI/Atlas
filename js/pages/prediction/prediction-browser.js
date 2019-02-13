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
	'components/cohortcomparison/ComparativeCohortAnalysis',
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
					title: 'Type',
                    data: d => d.type,
                    visible: false,
				},
				{
					title: 'Name',
					render: datatableUtils.getLinkFormatter(d => ({
						link: constants.multiAnalysisPaths.analysis(d.analysisId),
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
			if (this.canReadPredictions()) {
				this.loading(true);
				PredictionService.getPredictionList()
					.then(({ data }) => {
						this.loading(false);
						this.reference(data);
					});
			}
		}

		newPrediction() {
			document.location = constants.multiAnalysisPaths.createAnalysis();
		}

		goToSingleAnalysisPrediction() {
			document.location = constants.singleAnalysisPaths.browser();
		}
	}

	return commonUtils.build('prediction-browser', PredictionBrowser, view);
});