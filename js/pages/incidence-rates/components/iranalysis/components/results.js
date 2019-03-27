define([
	'knockout',
	'jquery',
	'text!./results.html',
	'utils/AutoBind',
	'services/IRAnalysis',
	'pages/incidence-rates/const',
	'services/MomentAPI',
	'services/AuthAPI',
	'components/Component',
	'utils/CommonUtils',
	'atlas-state',
	'databindings',
	'less!./results.less',
	'components/generation/select-sources-btn',
	'components/modal-exit-message'
], function (
	ko,
	$,
	view,
	AutoBind,
	IRAnalysisService,
	constants,
	momentApi,
	authApi,
	Component,
	commonUtils,
	sharedState
) {

	class IRAnalysisResultsViewer extends AutoBind(Component) {
		constructor(params) {
			super(params);
			this.sources = params.sources;
			this.hasSourceAccess = authApi.hasSourceAccess;
			this.generationSources = ko.computed(() => params.sources().map(s => ({
				...s.source,
				disabled: this.isInProgress(s) || !this.hasSourceAccess(s.source.sourceKey),
				disabledReason: this.isInProgress(s) ? 'Generation is in progress' : !this.hasSourceAccess(s.source.sourceKey) ? 'Access denied' : null,
			})));
			this.execute = params.execute;
			this.cancelExecution = params.cancelExecution;
			this.stoppingSources = params.stoppingSources;

			this.dirtyFlag = params.dirtyFlag;
			this.analysisCohorts = params.analysisCohorts;
			this.loadingSummary = params.loadingSummary;
			this.dirtyFlag = sharedState.IRAnalysis.dirtyFlag;
			this.selectedSource = ko.observable();
			this.selectedReport = ko.observable();
			this.rateMultiplier = ko.observable(1000);
			this.selectedTarget = ko.observable();
			this.selectedOutcome = ko.observable();
			this.isLoading = ko.observable();
			this.formatDateTime = function(date){
				return momentApi.formatDateTime(new Date(date));
			};

			this.isExitMessageShown = ko.observable(false);
			this.exitMessage = ko.observable();

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

			this.isExecutionDisabled = ko.computed(() => {
				return this.dirtyFlag().isDirty();
			});
			this.executionDisabledReason = () => 'Save changes to generate';
		}

		isInProgress(sourceItem) {
			return (sourceItem.info() && constants.isInProgress(sourceItem.info().executionInfo.status));
		}

		isSummaryLoading(sourceItem) {
			return sourceItem.source && this.loadingSummary && this.loadingSummary().find(sourceKey => sourceKey === sourceItem.source.sourceKey);
		}

		showExitMessage(sourceKey) {
			this.exitMessage(this.sources().find(si => si.source.sourceKey === sourceKey).info().executionInfo.message);
			this.isExitMessageShown(true);
		}

		getSummaryData(summaryList) {
			var targetId = this.selectedTarget();
			var outcomeId = this.selectedOutcome();
			const summary = summaryList.find(item => item.targetId == targetId && item.outcomeId == outcomeId) || {};
			const na = (values, converter = v => v) => values.filter(v => v === undefined).length > 0 ? 'n/a' : converter.apply(null, values);
			return {
				totalPersons: na([summary.totalPersons], tp => tp.toLocaleString()),
				cases: na([summary.cases], tp => tp.toLocaleString()),
				proportion: na([summary.cases, summary.totalPersons], (c, tp) => this.calculateProportion(c, tp)),
				timeAtRisk: na([summary.timeAtRisk], tar => tar.toLocaleString()),
				rate: na([summary.cases, summary.timeAtRisk], (c, tar) => this.calculateRate(c, tar)),
			};
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

			// fail-fast if source/targets are not set,
			if (!(this.selectedTarget() && this.selectedOutcome())) {
				this.selectedSource(null);
				this.selectedReport(null);
				return;
			}

			this.selectedSource(source);
			this.isLoading(true);

			IRAnalysisService.getReport(source.info().executionInfo.id.analysisId, source.source.sourceKey, this.selectedTarget(), this.selectedOutcome())
			.then((response) => {
				if (response.status && response.status !== 200) {
					throw new Error(response);
				}
				const report = response;
				// ensure report results are sorted in correct order (by id)
				report.stratifyStats.sort(function (a, b) {
					return a.id - b.id;
				});
				this.selectedReport(report);
				this.isLoading(false);
			})
			.catch(er => {
				console.error(er);
				alert('There was an error while loading generation result reports');
				this.isLoading(false);
			});
		};

		runGenerations(selectedSources) {
			if (!this.analysisCohorts().targetCohorts().length || !this.analysisCohorts().outcomeCohorts().length) {
				alert('You should select at least one target and outcome cohort to generate');
				return false;
			}
			selectedSources.forEach(source => this.execute(source.sourceKey));
		}

		closeReport() {
			this.selectedSource(null);
			this.selectedReport(null);
		}

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