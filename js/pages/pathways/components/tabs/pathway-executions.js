define([
	'knockout',
	'../../PathwayService',
	'../../PermissionService',
	'../../const',
	'text!./pathway-executions.html',
	'appConfig',
	'services/AuthAPI',
	'moment',
	'components/Component',
	'utils/AutoBind',
	'utils/CommonUtils',
	'utils/DatatableUtils',
	'services/MomentAPI',
	'services/Source',
	'lodash',
	'services/JobDetailsService',
	'services/MomentAPI',
	'services/Poll',
	'less!./pathway-executions.less',
	'components/modal-exit-message',
], function(
	ko,
	PathwayService,
	PermissionService,
	consts,
	view,
	config,
	authApi,
	moment,
	Component,
	AutoBind,
	commonUtils,
	datatableUtils,
	momentAPI,
	SourceService,
	lodash,
	jobDetailsService,
	momentApi,
	PollService
) {

	class PathwayExecutions extends AutoBind(Component) {
		constructor(params) {
			super();

			this.pathwayGenerationStatusOptions = consts.pathwayGenerationStatus;

			this.analysisId = params.analysisId;
			const currentHash = ko.pureComputed(() => params.design() && params.design().hashCode);

			this.isViewGenerationsPermitted = this.isViewGenerationsPermittedResolver();

			this.loading = ko.observable(false);
			this.expandedSection = ko.observable();
			this.isExecutionDesignShown = ko.observable(false);
			this.stopping = ko.observable({});
			this.isSourceStopping = (source) => this.stopping()[source.sourceKey];
			this.isEditPermitted = params.isEditPermitted;

			this.isExitMessageShown = ko.observable();
			this.exitMessage = ko.observable();
			this.pollId = null;

			this.execColumns = [{
					title: ko.i18n('columns.date', 'Date'),
					className: this.classes('col-exec-date'),
					render: datatableUtils.getDateFieldFormatter('startTime'),
				},
					{
						title: ko.i18n('columns.design', 'Design'),
						className: this.classes('col-exec-checksum'),
						render: (s, p, d) => {
							let html = '';
							if (PermissionService.isPermittedExportByGeneration(d.id)) {
								html = `<a data-bind="css: $component.classes('design-link'), click: () => $component.showExecutionDesign(${d.id})">${(d.tag || '-')}</a>`
							} else {
								html = d.tag || '-';
							}
							html += currentHash() === d.hashCode ? ' ' + ko.i18n('pathways.manager.executions.table.designValue', '(same as now)')() : '';
							return html;
						}
					},
					{
						title: ko.i18n('columns.status', 'Status'),
						data: 'status',
						className: this.classes('col-exec-status'),
						render: datatableUtils.getExecutionStatus(),
					},
				{
					title: ko.i18n('columns.duration', 'Duration'),
					className: this.classes('col-exec-duration'),
					render: (s, p, d) => {
						const endTime = d.endTime || Date.now();
						return d.startTime ? momentApi.formatDuration(endTime - d.startTime) : '';
					}
				},
				{
					title: ko.i18n('columns.results', 'Results'),
					data: 'results',
					className: this.classes('col-exec-results'),
					render: (s, p, d) => {
						return d.status === this.pathwayGenerationStatusOptions.COMPLETED
							? `<a data-bind="css: $component.classes('reports-link'), click: $component.goToResults.bind(null, id)">${ko.i18n('pathways.manager.executions.table.resultValues.text', 'View reports')()}</a>`
							: ko.i18n('pathways.manager.executions.table.resultValues.empty', '-')();
					}
				}
				];

			this.executionGroups = ko.observableArray([]);
			this.executionDesign = ko.observable(null);
			this.isViewGenerationsPermitted() && this.startPolling();
		}

		startPolling() {
			this.pollId = PollService.add({
				callback: silently => this.loadData({ silently }),
				interval: 10000,
				isSilentAfterFirstCall: true,
			});
		}

		dispose() {
			PollService.stop(this.pollId);
		}

		isViewGenerationsPermittedResolver() {
			return ko.computed(
				() => (this.analysisId() ? PermissionService.isPermittedListGenerations(this.analysisId()) : true)
			);
		}

		isGenerationPermitted(sourceKey) {
			return PermissionService.isPermittedGenerate(this.analysisId(), sourceKey);
		}

		isResultsViewPermitted(sourceKey) {
			return PermissionService.isPermittedResults(sourceKey);
		}

		getExecutionGroupStatus(submissions) {
			return submissions().find(s => s.status === this.pathwayGenerationStatusOptions.STARTED ||
				s.status === this.pathwayGenerationStatusOptions.PENDING ||
				s.status === this.pathwayGenerationStatusOptions.STARTING) ?
				this.pathwayGenerationStatusOptions.STARTED :
				this.pathwayGenerationStatusOptions.COMPLETED;
		}

		async loadData({silently = false} = {}) {
			!silently && this.loading(true);

			const analysisId = this.analysisId();

			try {
				const allSources = await SourceService.loadSourceList();
				const executionList = await PathwayService.listExecutions(analysisId);
				let sourceList = allSources.filter(source => {
					return (source.daimons.filter(function (daimon) { return daimon.daimonType == "CDM"; }).length > 0
							&& source.daimons.filter(function (daimon) { return daimon.daimonType == "Results"; }).length > 0)
				});

				sourceList = lodash.sortBy(sourceList, ["sourceName"]);

				sourceList.forEach(s => {
					let group = this.executionGroups().find(g => g.sourceKey == s.sourceKey);
					if (!group) {
						group = {
							sourceKey: s.sourceKey,
							sourceName: s.sourceName,
							submissions: ko.observableArray(),
							status: ko.observable()
						}
						this.executionGroups.push(group);
					}


					group.submissions(executionList.filter(e => e.sourceKey === s.sourceKey));
					group.status(this.getExecutionGroupStatus(group.submissions));
				});
			} catch (e) {
				console.error(e);
			} finally {
				this.loading(false);
			}
		}

		async generate(source) {
			this.stopping({ ...this.stopping(), [source]: false });
			const executionGroup = this.executionGroups().find(g => g.sourceKey === source);
			if (!executionGroup) return false;
			try {
				executionGroup.status(this.pathwayGenerationStatusOptions.PENDING);
				const data = await PathwayService.generate(this.analysisId(), source);
				jobDetailsService.createJob(data);
				this.loadData();
			} catch(e) {
				console.error(e);
				executionGroup.status(this.getExecutionGroupStatus(executionGroup.submissions));
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

		cancelGenerate(source) {
			this.stopping({...this.stopping(), [source.sourceKey]: true});
			if (confirm(ko.i18n('pathways.manager.executions.stopGenerationConfirmation', 'Do you want to stop generation?')())) {
				PathwayService.cancelGeneration(this.analysisId(), source.sourceKey);
			} else {
				this.stopping({...this.stopping(), [source.sourceKey]: false});
			}
		}

		showExecutionDesign(executionId) {
			this.executionDesign(null);
			this.isExecutionDesignShown(true);

			PathwayService
				.loadExportDesignByGeneration(executionId)
				.then(res => {
					this.executionDesign(res);
					this.loading(false);
				});
		}

		toggleSection(idx) {
			this.expandedSection() === idx ? this.expandedSection(null) : this.expandedSection(idx);
		}

		goToResults(executionId) {
			commonUtils.routeTo(`/pathways/${this.analysisId()}/results/${executionId}`);
		}

		goToLatestResults(sourceKey) {
			const sg = this.executionGroups().find(g => g.sourceKey === sourceKey);
			if (sg) {
				const submissions = [...sg.submissions()];
				if (submissions.length > 0) {
					submissions.sort((a, b) => b.endTime - a.endTime); // sort descending
					const latestExecutedSubmission = submissions.find(s => s.status === this.pathwayGenerationStatusOptions.COMPLETED);
					if (latestExecutedSubmission) {
						this.goToResults(latestExecutedSubmission.id);
						return;
					}
				}
			}
			alert(ko.i18n('pathways.manager.executions.noCompletedExecutionsWarning', 'There is no completed executions for the data source yet')());
		}
	}

	return commonUtils.build('pathway-executions', PathwayExecutions, view);
});