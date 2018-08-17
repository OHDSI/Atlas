define([
	'knockout',
	'text!./plp-browser.html',
	'appConfig',
	'webapi/MomentAPI',
	'services/PatientLevelPrediction',
	'webapi/AuthAPI',
	'providers/Component',
	'utils/CommonUtils',
	'components/heading',
	'components/empty-state',
	'faceted-datatable',
	'less!./plp-browser.less'
], function (
	ko,
	view,
	config,
	momentApi,
	plpService,
	authApi,
	Component,
	commonUtils
) {
	class PlpBrowser extends Component {
		constructor(params) {
		super();			
		
		this.loading = ko.observable(true);
		this.analysisList = ko.observable([]);

		this.canReadPlps = ko.pureComputed(() => {
		  return (config.userAuthenticationEnabled && authApi.isAuthenticated() && authApi.isPermittedReadPlps()) || !config.userAuthenticationEnabled;
		});
		this.canCreatePlp = ko.pureComputed(() => {
			return (config.userAuthenticationEnabled && authApi.isAuthenticated() && authApi.isPermittedCreatePlp()) || !config.userAuthenticationEnabled;
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
		
		// Load data from server
		plpService.getPlpList().then(({ data }) => {
			this.analysisList(data);
			this.loading(false);
		});
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
