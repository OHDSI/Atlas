define([
	'knockout',
	'jquery',
	'text!./results.html',
	'utils/AutoBind',
	'services/IRAnalysis',
	'pages/incidence-rates/const',
	'const',
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
	globalConsts,
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
			this.selectedAnalysisId = sharedState.IRAnalysis.selectedId;
			this.selectedSourceId = sharedState.IRAnalysis.selectedSourceId;
			this.selectedSourceId.subscribe(() => this.expandSelectedSource());
			this.hasSourceAccess = authApi.hasSourceAccess;
			this.generationSources = ko.computed(() => params.sources().map(s => ({
				...s.source,
				disabled: this.isInProgress(s) || !this.hasSourceAccess(s.source.sourceKey),
				disabledReason: this.isInProgress(s) ? 'Generation is in progress' : !this.hasSourceAccess(s.source.sourceKey) ? 'Access denied' : null,
			})));
			this.execute = params.execute;
			this.cancelExecution = params.cancelExecution;
			this.stoppingSources = params.stoppingSources;
			this.criticalCount = params.criticalCount;

			this.dirtyFlag = params.dirtyFlag;
			this.analysisCohorts = params.analysisCohorts;
			this.loadingSummary = params.loadingSummary;
			this.dirtyFlag = sharedState.IRAnalysis.dirtyFlag;
			this.isTarValid = params.isTarValid;
			this.selectedSource = ko.observable();
			this.selectedReport = ko.observable();
			this.rateMultiplier = ko.observable(1000);
			this.selectedTarget = ko.observable();
			this.selectedOutcome = ko.observable();
			this.isLoading = ko.observable();
			this.isEditable = params.isEditable;
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

			this.subscriptions.push(this.selectedTarget.subscribe((newVal) => {
				if (this.selectedSourceId()) // this will cause a report refresh
					this.expandSelectedSource();
			}));
			
			this.subscriptions.push(this.selectedOutcome.subscribe((newVal) => {
				if (this.selectedSourceId()) // this will cause a report refresh
					this.expandSelectedSource();
			}));

			this.executionDisabled = ko.pureComputed(() => {
				return (this.dirtyFlag().isDirty() || !this.isTarValid() || this.criticalCount() > 0);
			});
			
			this.executionDisabledReason = ko.pureComputed(() => { 
				if (!this.executionDisabled()) return null;
				if (this.dirtyFlag().isDirty()) return globalConsts.disabledReasons.DIRTY;
				if (!this.isTarValid()) return globalConsts.disabledReasons.INVALID_TAR;
				if (this.criticalCount() > 0) return globalConsts.disabledReasons.INVALID_DESIGN;
				return globalConsts.disabledReasons.ACCESS_DENIED;
			});

			this.disableExportAnalysis = ko.pureComputed(() => {
				return this.dirtyFlag().isDirty() || !this.sources().some(si => si.info() && si.info().executionInfo.status === constants.status.COMPLETE);
			});

			this.expandSelectedSource();
		}

		reportDisabledReason(source) {
			return ko.pureComputed(() => !this.hasSourceAccess(source.sourceKey) ? globalConsts.disabledReasons.ACCESS_DENIED : null);
		}

		isExecutionDisabled(source) {
			return ko.pureComputed(() => {
				return !this.hasSourceAccess(source.sourceKey) || this.dirtyFlag().isDirty()|| !this.isTarValid();
			});
		}

		isInProgress(sourceItem) {
			return (sourceItem.info() && constants.isInProgress(sourceItem.info().executionInfo.status));
		}

		isSummaryLoading(sourceItem) {
			return sourceItem.source && this.loadingSummary && this.loadingSummary().find(sourceKey => sourceKey === sourceItem.source.sourceKey);
		}

		getSourceName() {
			if (this.selectedSourceId()) {
				const source = this.sources().find(s => s.source.sourceId === this.selectedSourceId());
				if (source) {
					return source.source.sourceName;
				}
			}
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
			if (source) {
				this.selectedSourceId(source.source.sourceId);
			}
		}

		expandSelectedSource() {			
			if (!(this.selectedTarget() && this.selectedOutcome())) {
				this.selectedReport(null);
				return;
			}

			const source = this.sources().find(s => s.source.sourceId === this.selectedSourceId());
			if (!source) {
				// no source was selected
				this.selectedReport(null);
				return;
			}
			// stop subscribing for source loading
			if (this.sourceInfoSubscribeId) {
				this.sourceInfoSubscribeId.dispose();
			}
			if (!source.info()) {
				// if sources were not loaded yet - wait for their loading
				this.sourceInfoSubscribeId = source.info.subscribe(() => this.expandSelectedSource());
				// prevent further processing
				return;
			}
			if (source.source.sourceId !== this.selectedSourceId()) {				
				commonUtils.routeTo('/iranalysis/' + this.selectedAnalysisId() + '/generation/' + source.source.sourceId);
				// prevent further processing
				return;
			}

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
			this.selectedReport(null);
		}

		msToTime(s) {
			return momentApi.formatDuration(s);
		};
	}

	return commonUtils.build('ir-analysis-results', IRAnalysisResultsViewer, view);
});