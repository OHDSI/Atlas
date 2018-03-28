define(['knockout',
				'jquery',
				'text!./results.html',
				'webapi/IRAnalysisAPI',
				'webapi/MomentAPI',
				'databindings'
], function (
	ko,
	$,
	template,
	iraAPI,
	momentApi) {

	function IRAnalysisResultsViewer(params) {
		var self = this;

		self.sources = params.sources;
		self.dirtyFlag = params.dirtyFlag;
		self.analysisCohorts = params.analysisCohorts;
		self.selectedSource = ko.observable();
		self.selectedReport = ko.observable();
		self.rateMultiplier = ko.observable(1000);
		self.selectedTarget = ko.observable();
		self.selectedOutcome = ko.observable();
		self.isLoading = ko.observable();
		self.formatDateTime = function(date){
			return momentApi.formatDateTime(new Date(date));
    };
		
		self.irCaption = ko.pureComputed(function () {
			var multiplier = self.rateMultiplier();
			if (multiplier >= 1000)
				multiplier = (multiplier / 1000) + "k"
			return "per " + multiplier  + " years";
		});
		
		self.ipCaption = ko.pureComputed(function () {
			var multiplier = self.rateMultiplier();
			if (multiplier >= 1000)
				multiplier = (multiplier / 1000) + "k"
			return "per " + multiplier  + " persons";
		});		
		
		self.getSummaryData = function (summaryList) {
			var targetId = self.selectedTarget();
			var outcomeId = self.selectedOutcome();			
			return summaryList.filter(function (item) {
					return (item.targetId == targetId && item.outcomeId == outcomeId);
				})[0] || {totalPersons: 0, cases: 0, timeAtRisk: 0};
		}
		
		// viewmodel behaviors

		self.calculateRate = function(cases, timeAtRisk)
		{
			if (timeAtRisk > 0)
				return ((1.0 * cases) / (1.0 * timeAtRisk) * self.rateMultiplier()).toFixed(2);
			else 
				return (0).toFixed(2);
		}
		
		self.calculateProportion = function(cases, persons)
		{
			if (persons > 0)
				return (((1.0 * cases) / (1.0 * persons)) * self.rateMultiplier()).toFixed(2);
			else 
				return (0).toFixed(2);
		}		

		self.stepUp = function() {
			self.rateMultiplier(Math.min(self.rateMultiplier() * 10, 100000));	
		}

		self.stepDown = function() {
			self.rateMultiplier(Math.max(self.rateMultiplier() / 10, 100));	
		}
		
		self.selectSource = function (source) {
			self.selectedSource(source);
			self.isLoading(true);

			iraAPI.getReport(source.info().executionInfo.id.analysisId, source.source.sourceKey, self.selectedTarget(), self.selectedOutcome()).then(function (report) {
				// ensure report results are sorted in correct order (by id)
				report.stratifyStats.sort(function (a, b) {
					return a.id - b.id;
				});
				self.selectedReport(report);
				self.isLoading(false);
			});
		};

		self.msToTime = function (s) {
			return momentApi.formatDuration(s);
		};
		
		// observable subscriptions
		
		self.targetSub = self.selectedTarget.subscribe(function(newVal) {
			if (self.selectedSource()) // this will cause a report refresh
				self.selectSource(self.selectedSource());
		});
		
		self.outcomeSub = self.selectedOutcome.subscribe(function(newVal) {
			if (self.selectedSource()) // this will cause a report refresh
				self.selectSource(self.selectedSource());
		});
		
		
		self.dispose = function() {
			self.targetSub.dispose();
			self.outcomeSub.dispose();
		};

	}

	var component = {
		viewModel: IRAnalysisResultsViewer,
		template: template
	};

	return component;
});