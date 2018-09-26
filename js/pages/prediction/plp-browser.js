define([
	'knockout',
	'text!./plp-browser.html',
	'appConfig',
	'utils/MomentUtils',
	'services/PatientLevelPredictionService',
	'services/AuthService',
	'services/permissions/PlpPermissionService',
	'providers/Page',
	'utils/CommonUtils',
	'components/heading',
	'components/empty-state',
  'faceted-datatable',
	'less!./plp-browser.less'
], function (
	ko,
	view,
	config,
	momentUtils,
	plpService,
	AuthService,
	PlpPermissionService,
	Page,
	commonUtils
) {
	class PlpBrowser extends Page {
		constructor(params) {
			super(params);
			this.loading = ko.observable(true);
			this.analysisList = ko.observableArray([]);

			this.canReadPlps = ko.pureComputed(() => {
				return (config.userAuthenticationEnabled && AuthService.isAuthenticated() && PlpPermissionService.isPermittedReadPlps()) || !config.userAuthenticationEnabled;
			});
			this.canCreatePlp = ko.pureComputed(() => {
				return (config.userAuthenticationEnabled && AuthService.isAuthenticated() && PlpPermissionService.isPermittedCreatePlp()) || !config.userAuthenticationEnabled;
			});

			this.options = {
				Facets: [
					{
						'caption': 'Last Modified',
						'binding': function (o) {
							var createDate = new Date(o.createdDate);
							var modDate = new Date(o.modifiedDate);
							var dateForCompare = (createDate > modDate) ? createDate : modDate;
							var daysSinceModification = (new Date().getTime() - dateForCompare.getTime()) / 1000 / 60 / 60 / 24;
							if (daysSinceModification < 7) {
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
					render: function(s, p, d){
						return momentUtils.formatDateTimeUTC(d.createdDate);
					},
					sType: 'date-uk'
				},
				{
					title: 'Modified',
					render: function (s, p, d) {
						return momentUtils.formatDateTimeUTC(d.modifiedDate);
					},
					sType: 'date-uk'
				},
				{
					title: 'Author',
					data: 'createdBy'
				}
			];
			
		}
		
		async onPageCreated() {
			// Load data from server
			const list = await plpService.find();
			this.analysisList(list);
			this.loading(false);			
		}

		rowClick(d) {
			document.location = "#/plp/" + d.analysisId;
		}


		newPatientLevelPrediction() {
			document.location = '#/plp/0';
		}

	}

	return commonUtils.build('plp-browser', PlpBrowser, view);

});
