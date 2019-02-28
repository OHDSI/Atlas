define([
	'knockout',
	'appConfig',
	'text!./prediction-executions.html',
	'utils/CommonUtils',
	'utils/AutoBind',
	'utils/DatatableUtils',
	'components/Component',
	'../PermissionService',
	'services/Prediction',
	'services/Source',
	'services/Poll',
	'services/file',
	'utils/ExecutionUtils',
	'../const',
	'lodash',
	'less!./prediction-executions.less',
	'components/modal-exit-message',
], function(
	ko,
	config,
	view,
	commonUtils,
	AutoBind,
	datatableUtils,
	Component,
	PermissionService,
	PredictionService,
	SourceService,
	PollService,
	FileService,
	ExecutionUtils,
	consts,
	lodash,
){

	class PredictionGeneration extends AutoBind(Component) {

		constructor(params) {
			super(params);

			this.loading = ko.observable();
			this.expandedSection = ko.observable();

			this.analysisId = params.analysisId;
			this.dirtyFlag = params.dirtyFlag;
			this.isViewGenerationsPermitted = this.isViewGenerationsPermittedResolver();

			this.predictionStatusGenerationOptions = consts.predictionGenerationStatus;
			this.isExitMessageShown = ko.observable();
			this.exitMessage = ko.observable();

			this.execColumns = [
				{
					title: 'Date',
					className: this.classes('col-exec-date'),
					render: datatableUtils.getDateFieldFormatter('startTime'),
					type: 'datetime-formatted'
				},
				{
					title: 'Status',
					data: 'status',
					className: this.classes('col-exec-status'),
					render: (s, p, d) => s === 'FAILED' ? `<a href='#' data-bind="css: $component.classes('status-link'), click: () => $component.showExitMessage('${d.sourceKey}', ${d.id})">${s}</a>` : s,
				},
				{
					title: 'Duration',
					className: this.classes('col-exec-duration'),
					render: (s, p, d) => {
						const durationSec = ((d.endTime || (new Date()).getTime()) - d.startTime) / 1000;
						return `${Math.floor(durationSec / 60)} min ${Math.round(durationSec % 60)} sec`;
					}
				},
				{
					title: 'Results',
					className: this.classes('col-exec-results'),
					render: (s, p, d) => {
						return (d.status === this.predictionStatusGenerationOptions.COMPLETED || d.status === this.predictionStatusGenerationOptions.FAILED) && this.isResultsViewPermitted(d.id) && d.numResultFiles > 0 ?
							`<a href='#' data-bind="ifnot: $component.isDownloadInProgress(id), css: $component.classes('reports-link'), click: $component.downloadResults.bind($component, id)"><i class="prediction-generation__action-ico fa fa-download"></i> Download ${d.numResultFiles} files</a><span data-bind="if: $component.isDownloadInProgress(id)"><i class="prediction-generation__action-ico fa fa-spinner fa-spin"></i> Downloading ${d.numResultFiles} files...</span>`
							: '-';
					}
				},
			];
			this.downloading = ko.observableArray([]);
			this.isResultsDownloading = ko.computed(() => this.downloading().length > 0);
			this.executionGroups = ko.observableArray([]);
			if (this.isViewGenerationsPermitted()) {
				this.loadData();
				this.intervalId = PollService.add(() => {
					this.loadData({ silently: true });
				}, 10000);
			}
		}

		dispose() {
			PollService.stop(this.intervalId);
		}

		isDownloadInProgress(id) {
			return ko.computed(() => this.downloading.indexOf(id) > -1);
		}

		isGeneratePermitted(sourceKey) {
			return !this.dirtyFlag().isDirty() && PermissionService.isPermittedGenerate(sourceKey, this.analysisId()) && config.api.isExecutionEngineAvailable();
		}

		isResultsViewPermitted(id) {
			return PermissionService.isPermittedViewResults(id);
		}

		findLatestSubmission(sourceKey) {
			const sg = this.executionGroups().find(g => g.sourceKey === sourceKey);
			if (sg) {
				const submissions = [...sg.submissions()];
				if (submissions.length > 0) {
					submissions.sort((a, b) => b.endTime - a.endTime); // sort descending
					return submissions.find(s => s.status === this.predictionStatusGenerationOptions.COMPLETED);
				}
			}
			return null;
		}

		downloadLatestResults(sourceKey) {
			const submission = this.findLatestSubmission(sourceKey);
			if (submission) {
				this.downloadResults(submission.id);
			}
		}

		isViewGenerationsPermittedResolver() {
			return ko.computed(() => this.analysisId() ? PermissionService.isPermittedListGenerations(this.analysisId()) : true);
		}

		async loadData({silently = false} = {}) {
			!silently && this.loading(true);

			try{
				const allSources = await SourceService.loadSourceList();
				const executionList = await PredictionService.listGenerations(this.analysisId());

				let sourceList = allSources.filter(source => {
					return (source.daimons.filter(function (daimon) { return daimon.daimonType === "CDM"; }).length > 0
						&& source.daimons.filter(function (daimon) { return daimon.daimonType === "Results"; }).length > 0);
				});

				sourceList = lodash.sortBy(sourceList, ["sourceName"]);

				sourceList.forEach(s => {
					let group = this.executionGroups().find(g => g.sourceKey === s.sourceKey);
					if (!group) {
						group = {
							sourceKey: s.sourceKey,
							sourceName: s.sourceName,
							submissions: ko.observableArray(),
							status: ko.observable(),
						};
						this.executionGroups.push(group);
					}

					group.submissions(executionList.filter(e => e.sourceKey === s.sourceKey));
					group.status(group.submissions().find(s => s.status === this.predictionStatusGenerationOptions.STARTED
						|| s.status === this.predictionStatusGenerationOptions.RUNNING) ?
						this.predictionStatusGenerationOptions.STARTED :
						this.predictionStatusGenerationOptions.COMPLETED);
				});
			}finally {
				this.loading(false);
			}
		}

		generate(sourceKey) {

			const executionGroup = this.executionGroups().find(g => g.sourceKey === sourceKey);

			this.loading(true);
			ExecutionUtils.StartExecution(executionGroup)
				.then(() => PredictionService.generate(this.analysisId(), sourceKey))
				.then(() => this.loadData())
				.catch(() => {});
		}

		toggleSection(idx) {
			this.expandedSection() === idx ? this.expandedSection(null) : this.expandedSection(idx);
		}

		async downloadResults(generationId) {
			this.downloading.push(generationId);
			try {
				await FileService.loadZip(config.webAPIRoot + consts.apiPaths.downloadResults(generationId), `prediction-analysis-results-${generationId}.zip`);
			} finally {
				this.downloading.remove(generationId);
			}
		}

		showExitMessage(sourceKey, id) {
			const group = this.executionGroups().find(g => g.sourceKey === sourceKey) || { submissions: ko.observableArray() };
			const submission = group.submissions().find(s => s.id === id);
			if (submission && submission.exitMessage) {
				this.exitMessage(submission.exitMessage);
				this.isExitMessageShown(true);
			}
		}

	}

	commonUtils.build('prediction-executions', PredictionGeneration, view);

});