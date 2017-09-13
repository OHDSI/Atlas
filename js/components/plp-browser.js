define(['knockout', 'jquery', 'text!./plp-browser.html', 'appConfig', 'd3', 'webapi/PatientLevelPredictionAPI'], function (ko, $, view, config, d3, plpAPI) {
	function plpBrowser(params) {
		var self = this;
		self.loading = ko.observable(true);
		self.analysisList = ko.observableArray();
		self.config = config;

		self.options = {
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

		self.rowClick = function (d) {
			document.location = "#/plp/" + d.analysisId;
		}

		self.columns = [
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
				title: 'Modified',
				render: function (s, p, d) {
					return new Date(d.modifiedDate || d.createdDate).toLocaleString();
				},
				sType: 'date-uk'
			},
		];

		self.newPatientLevelPrediction = function () {
			document.location = '#/plp/0';
		}

		// Load data from server
		plpAPI.getPlpList().then(function (data) {
			self.analysisList(data);
			self.loading(false);
		});
	}

	var component = {
		viewModel: plpBrowser,
		template: view
	};

	ko.components.register('plp-browser', component);
	return component;

});
