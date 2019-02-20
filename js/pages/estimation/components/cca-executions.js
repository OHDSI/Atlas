define([
	'knockout',
	'appConfig',
	'text!./cca-executions.html',
	'utils/CommonUtils',
	'utils/AutoBind',
	'utils/DatatableUtils',
	'components/Component',
	'../PermissionService',
	'services/Estimation',
	'services/Source',
	'services/Poll',
	'services/file',
	'../const',
	'lodash',
	'less!./cca-executions.less',
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
	EstimationService,
	SourceService,
	PollService,
	FileService,
	consts,
	lodash,
) {
	
	class EstimationGeneration extends AutoBind(Component) {
		constructor(params) {
			super(params);

			this.loading = ko.observable();
			this.expandedSection = ko.observable();

			this.analysisId = params.estimationId;
			this.dirtyFlag = params.dirtyFlag;
			this.isViewGenerationsPermitted = this.isViewGenerationsPermittedResolver();

			this.estimationStatusGenerationOptions = consts.estimationGenerationStatus;
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
						return (d.status === this.estimationStatusGenerationOptions.COMPLETED || d.status === this.estimationStatusGenerationOptions.FAILED) && this.isResultsViewPermitted(d.id) && d.numResultFiles > 0 ?
							`<a href='#' data-bind="css: $component.classes('reports-link'), click: $component.downloadResults.bind(null, id)"><i class="estimation-generation__action-ico fa fa-download"></i>Download ${d.numResultFiles} files</a>` : '-';
					}
				},
			];
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

		isGeneratePermitted(sourceKey) {
			return !this.dirtyFlag().isDirty() && PermissionService.isPermittedGenerate(sourceKey, this.analysisId()) && config.api.isExecutionEngineAvailable();
		}

		isResultsViewPermitted(id) {
			return PermissionService.isPermittedViewResults(id);
		}

		isViewGenerationsPermittedResolver() {
			return ko.computed(() => this.analysisId() ? PermissionService.isPermittedListGenerations(this.analysisId()) : true);
		}

		loadData({silently = false} = {}) {
			!silently && this.loading(true);
			Promise.all([
				SourceService.loadSourceList(),
				EstimationService.listGenerations(this.analysisId()),
			]).then(([
								 allSources,
								 executionList,
							 ]) => {
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

					group.submissions((executionList && executionList.filter(e => e.sourceKey === s.sourceKey)) || []);
					group.status(group.submissions() && group.submissions().find(s => s.status === this.estimationStatusGenerationOptions.STARTED) ?
						this.estimationStatusGenerationOptions.STARTED :
						this.estimationStatusGenerationOptions.COMPLETED);
				});

			}).finally(() => this.loading(false));
		}

		generate(sourceKey) {

			let confirmPromise;

			const executionGroup = this.executionGroups().find(g => g.sourceKey === sourceKey);
			if (!executionGroup) {
				confirmPromise = new Promise((resolve, reject) => reject());
			} else {
				if (executionGroup.status() === this.estimationStatusGenerationOptions.STARTED) {
					confirmPromise = new Promise((resolve, reject) => {
						if (confirm('A generation for the source has already been started. Are you sure you want to start a new one in parallel?')) {
							resolve();
						} else {
							reject();
						}
					})
				} else {
					confirmPromise = new Promise(res => res());
				}
			}

			this.loading(true);
			confirmPromise
				.then(() => EstimationService.generate(this.analysisId(), sourceKey))
				.then(() => this.loadData())
				.catch(() => {});
		}

		toggleSection(idx) {
			this.expandedSection() === idx ? this.expandedSection(null) : this.expandedSection(idx);
		}

		downloadResults(generationId) {
			FileService.loadZip(config.webAPIRoot + consts.apiPaths.downloadResults(generationId), `estimation-analysis-results-${generationId}.zip`);
		}

		findLatestSubmission(sourceKey) {
			const sg = this.executionGroups().find(g => g.sourceKey === sourceKey);
			if (sg) {
				const submissions = [...sg.submissions()];
				if (submissions.length > 0) {
					submissions.sort((a, b) => b.endTime - a.endTime); // sort descending
					return submissions.find(s => s.status === this.estimationStatusGenerationOptions.COMPLETED);
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

		showExitMessage(sourceKey, id) {
			const group = this.executionGroups().find(g => g.sourceKey === sourceKey) || { submissions: ko.observableArray() };
			const submission = group.submissions().find(s => s.id === id);
			if (submission && submission.exitMessage) {
				this.exitMessage(submission.exitMessage);
				this.isExitMessageShown(true);
			}
		}
	}
	
	commonUtils.build('comparative-cohort-analysis-executions', EstimationGeneration, view);
});