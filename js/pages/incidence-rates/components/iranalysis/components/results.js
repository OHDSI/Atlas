define([
	'knockout',
	'jquery',
	'text!./results.html',
	'services/IRAnalysis',
	'webapi/MomentAPI',
	'providers/Component',
	'utils/CommonUtils',
	'databindings'
], function (
	ko,
	$,
	view,
	IRAnalysisService,
	momentApi,
	Component,
	commonUtils
) {

	class IRAnalysisResultsViewer extends Component {
		constructor(params) {
			super(params);
			this.sources = params.sources;
			this.dirtyFlag = params.dirtyFlag;
			this.analysisCohorts = params.analysisCohorts;
			this.selectedSource = ko.observable();
			this.selectedReport = ko.observable();
			this.rateMultiplier = ko.observable(1000);
			this.selectedTarget = ko.observable();
			this.selectedOutcome = ko.observable();
			this.isLoading = ko.observable();
			this.formatDateTime = function(date){
				return momentApi.formatDateTime(new Date(date));
			};
			
			this.irCaption = ko.pureComputed(() => {
				var multiplier = this.rateMultiplier();
				if (multiplier >= 1000)
					multiplier = (multiplier / 1000) + "k"
				return "per " + multiplier  + " years";
			});
			
			this.ipCaption = ko.pureComputed(() => {
				var multiplier = this.rateMultiplier();
				if (multiplier >= 1000)
					multiplier = (multiplier / 1000) + "k"
				return "per " + multiplier  + " persons";
			});
			
			// observable subscriptions
			
			this.targetSub = this.selectedTarget.subscribe((newVal) => {
				if (this.selectedSource()) // this will cause a report refresh
					this.selectSource(this.selectedSource());
			});
			
			this.outcomeSub = this.selectedOutcome.subscribe((newVal) => {
				if (this.selectedSource()) // this will cause a report refresh
					this.selectSource(this.selectedSource());
			});

			this.getSummaryData = this.getSummaryData.bind(this);
			this.calculateRate = this.calculateRate.bind(this);
			this.calculateProportion = this.calculateProportion.bind(this);
			this.stepUp = this.stepUp.bind(this);
			this.stepDown = this.stepDown.bind(this);
			this.selectSource = this.selectSource.bind(this);
			this.dispose = this.dispose.bind(this);
		}
		
		getSummaryData(summaryList) {
			var targetId = this.selectedTarget();
			var outcomeId = this.selectedOutcome();			
			return summaryList.filter(function (item) {
					return (item.targetId == targetId && item.outcomeId == outcomeId);
				})[0] || {totalPersons: 0, cases: 0, timeAtRisk: 0};
		}
		
		// viewmodel behaviors

		calculateRate(cases, timeAtRisk) {
			if (timeAtRisk > 0)
				return ((1.0 * cases) / (1.0 * timeAtRisk) * this.rateMultiplier()).toFixed(2);
			else 
				return (0).toFixed(2);
		}
		
		calculateProportion(cases, persons) {
			if (persons > 0)
				return (((1.0 * cases) / (1.0 * persons)) * this.rateMultiplier()).toFixed(2);
			else 
				return (0).toFixed(2);
		}		

		stepUp() {
			this.rateMultiplier(Math.min(this.rateMultiplier() * 10, 100000));	
		}

		stepDown() {
			this.rateMultiplier(Math.max(this.rateMultiplier() / 10, 100));	
		}
		
		selectSource(source) {
			this.selectedSource(source);
			this.isLoading(true);

			IRAnalysisService.getReport(source.info().executionInfo.id.analysisId, source.source.sourceKey, this.selectedTarget(), this.selectedOutcome()).then((report) => {
				// ensure report results are sorted in correct order (by id)
				report.stratifyStats.sort(function (a, b) {
					return a.id - b.id;
				});
				this.selectedReport(report);
				this.isLoading(false);
			});
		};

		msToTime(s) {
			return momentApi.formatDuration(s);
		};	
		
		dispose() {
			this.targetSub.dispose();
			this.outcomeSub.dispose();
		};
	}

	return commonUtils.build('ir-analysis-results', IRAnalysisResultsViewer, view);
});