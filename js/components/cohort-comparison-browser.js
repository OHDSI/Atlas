define(['knockout', 'text!./cohort-comparison-browser.html', 'appConfig','cohortcomparison/ComparativeCohortAnalysis','faceted-datatable'], function (ko, view, config) {
	function cohortComparisonBrowser(params) {
		var self = this;
		self.reference = ko.observableArray();
		self.loading = ko.observable(false);
		self.config = config;

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
					return new Date(d.created).toLocaleDateString();
				}
			},
			{
				title: 'Modified',
				render: function (s, p, d) {
					return new Date(d.modified).toLocaleDateString();
				}
			}
		];

		self.newCohortComparison = function() {
			document.location = '#/estimation/0'	;
		}
		
		self.loading(true);
		
		$.ajax({
			url: config.services[0].url + 'comparativecohortanalysis',
			method: 'GET',
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