define(['knockout',
				'jquery',
				'text!./FeasibilityResultsViewerTemplate.html',
				'webapi/FeasibilityAPI',
				'./GenerateComponentSmall',
				'databindings/eventListenerBinding',
				'./FeasibilityReportViewer'
			 ],
	function (
		ko,
		$,
		template,
		feasibilityAPI,
		generateComponentSmall) {

		ko.components.register('generate-component-small', generateComponentSmall);
	
		var x;

		function FeasibilityResultsViewer(params) {
			var self = this;
			
			self.sources = params.sources;
			self.dirtyFlag = params.dirtyFlag;
			self.selectedSource = ko.observable();
			self.selectedReport = ko.observable();
			
			// viewmodel behaviors
			
			self.selectSource = function(source)
			{
				if (source.info()) {
					self.selectedSource(null);
					feasibilityAPI.getReport(source.info().generationInfo.id.studyId, source.source.sourceKey).then(function(report) {
						// ensure report results are sorted in correct order (by id)
						report.inclusionRuleStats.sort(function(a,b) {
							return a.id - b.id;
						});
						self.selectedSource(source);
						self.selectedReport(report);
					});
				}
			}
			
			self.msToTime = function(s) {

				function addZ(n) {
						return (n < 10 ? '0' : '') + n;
				}

				function formatMS(n) {
						if (n < 10) {
								return '00' + n;
						} else if (n < 100) {
								return '0' + n;
						}
						else {
								return n;
						}
				}

				var ms = s % 1000;
				s = (s - ms) / 1000;
				var secs = s % 60;
				s = (s - secs) / 60;
				var mins = s % 60;

				var hrs = (s - mins) / 60;

				return addZ(hrs) + ':' + addZ(mins) + ':' + addZ(secs);
      }

		}

		var component = {
			viewModel: FeasibilityResultsViewer,
			template: template
		};

		ko.components.register('feasibility-results-viewer', component);

		// return compoonent definition
		return component;
	});
