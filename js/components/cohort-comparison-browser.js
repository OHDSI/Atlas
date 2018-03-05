define(['knockout', 'text!./cohort-comparison-browser.html', 'appConfig', 'webapi/MomentAPI', 'webapi/AuthAPI', 'cohortcomparison/ComparativeCohortAnalysis','faceted-datatable'], function (ko, view, config, momentApi, authApi) {
	function cohortComparisonBrowser(params) {
		var self = this;
		self.reference = ko.observableArray();
		self.loading = ko.observable(false);
		self.config = config;

		self.isAuthenticated = authApi.isAuthenticated;
		self.canReadEstimations = ko.pureComputed(function () {
			return (config.userAuthenticationEnabled && self.isAuthenticated() && authApi.isPermittedReadEstimations()) || !config.userAuthenticationEnabled;
		});
		self.canCreateEstimation = ko.pureComputed(function(){
			return (config.userAuthenticationEnabled && self.isAuthenticated() && authApi.isPermittedCreateEstimation()) || !config.userAuthenticationEnabled;
			});

		self.options = {
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

		self.rowClick = function (d) {
			document.location = '#/estimation/' + d.analysisId;
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
				title: 'Created',
				render: function (s, p, d) {
					return momentApi.formatDateTimeUTC(d.created);
				}
			},
			{
				title: 'Modified',
				render: function (s, p, d) {
					return momentApi.formatDateTimeUTC(d.updated);
				}
			},
			{
				title: 'Author',
				data: 'createdBy'
			}
		];

		self.newCohortComparison = function() {
			document.location = '#/estimation/0'	;
		}
		
		self.loading(true);
		
		$.ajax({
			url: config.api.url + 'comparativecohortanalysis',
			method: 'GET',
			error: authApi.handleAccessDenied,
			success: function (d) {
				self.loading(false);
				self.reference(d);
			}
		});
	}

	var component = {
		viewModel: cohortComparisonBrowser,
		template: view
	};

	ko.components.register('cohort-comparison-browser', component);
	return component;
});