define([
	'knockout',
	'text!./plp-browser.html',
	'appConfig',
	'./const',
	'utils/DatatableUtils',
	'services/MomentAPI',
	'services/PatientLevelPrediction',
	'services/AuthAPI',
	'pages/Page',
	'utils/CommonUtils',
	'components/heading',
	'components/empty-state',
  'faceted-datatable',
	'less!./plp-browser.less'
], function (
	ko,
	view,
	config,
	constants,
	datatableUtils,
	momentApi,
	plpService,
	authApi,
	Page,
	commonUtils
) {
	class PlpBrowser extends Page {
		constructor(params) {
			super(params);
			this.loading = ko.observable(true);
			this.analysisList = ko.observableArray([]);
			this.config = config;

			this.canReadPlps = ko.pureComputed(() => {
				return (config.userAuthenticationEnabled && authApi.isAuthenticated() && authApi.isPermittedReadPlps()) || !config.userAuthenticationEnabled;
			});
			this.canCreatePlp = ko.pureComputed(() => {
				return (config.userAuthenticationEnabled && authApi.isAuthenticated() && authApi.isPermittedCreatePlp()) || !config.userAuthenticationEnabled;
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
						link: constants.singleAnalysisPaths.analysis(d.analysisId),
						label: d['name']
					})),
				},
				{
					title: 'Created',
					render: function(s, p, d){
						return momentApi.formatDateTimeUTC(d.createdDate);
					},
					sType: 'date-uk'
				},
				{
					title: 'Modified',
					render: function (s, p, d) {
						return momentApi.formatDateTimeUTC(d.modifiedDate);
					},
					sType: 'date-uk'
				},
				{
					title: 'Author',
					data: 'createdBy'
				}
			];
		}

		onPageCreated() {
			if (this.canReadPlps()) {
				this.loading(true);
				plpService.getPlpList().then(({ data }) => {
					this.analysisList(data);
					this.loading(false);
				});
			}
		}


		newPatientLevelPrediction() {
			document.location = constants.singleAnalysisPaths.createAnalysis();
		}

		goToMultiAnalysisPrediction() {
			document.location = constants.multiAnalysisPaths.browser();
		}

	}

	return commonUtils.build('plp-browser', PlpBrowser, view);

});
