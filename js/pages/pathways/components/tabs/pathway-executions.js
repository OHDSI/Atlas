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
	'services/Source',
	'lodash',
  'services/JobDetailsService',
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
	SourceService,
	lodash,
  jobDetailsService,
	PollService
) {
	class PathwayExecutions extends AutoBind(Component) {
		constructor(params) {
			super();

			this.pathwayGenerationStatusOptions = consts.pathwayGenerationStatus;

			this.analysisId = params.analysisId;
			const currentHash = ko.pureComputed(() => params.design().hash);

			this.isViewGenerationsPermitted = this.isViewGenerationsPermittedResolver();

			this.loading = ko.observable(false);
			this.expandedSection = ko.observable();
			this.isExecutionDesignShown = ko.observable(false);
			this.stopping = ko.observable({});
			this.isSourceStopping = (source) => this.stopping()[source.sourceKey];

			this.isExitMessageShown = ko.observable();
			this.exitMessage = ko.observable();
			this.pollId = null;

			this.execColumns = [{
					title: 'Date',
					className: this.classes('col-exec-date'),
					render: datatableUtils.getDateFieldFormatter('startTime'),
					type: 'datetime-formatted'
				},
				{
					title: 'Design',
					className: this.classes('col-exec-checksum'),
					render: (s, p, d) => {
						return (
							PermissionService.isPermittedExportByGeneration(d.id) ?
							`<a data-bind="css: $component.classes('design-link'), click: () => $component.showExecutionDesign(${d.id})">${(d.hashCode || '-')}</a>${currentHash() === d.hashCode ? ' (same as now)' : ''}` :
							(d.hashCode || '-')
						);
					}
				},
				{
					title: 'Status',
					data: 'status',
					className: this.classes('col-exec-status'),
					render: (s, p, d) => {
						if (s === 'FAILED') {
							return `<a href='#' data-bind="css: $component.classes('status-link'), click: () => $component.showExitMessage('${d.sourceKey}', ${d.id})">${s}</a>`;
						} else if (s === 'STOPPED') {
							return 'CANCELED';
						} else {
							return s;
						}
					},
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
					data: 'results',
					className: this.classes('col-exec-results'),
					render: (s, p, d) => {
						return d.status === this.pathwayGenerationStatusOptions.COMPLETED ? `<a data-bind="css: $component.classes('reports-link'), click: $component.goToResults.bind(null, id)">View reports</a>` : '-';
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
			return submissions().find(s => s.status === this.pathwayGenerationStatusOptions.STARTED) ?
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
			if (confirm('Do you want to stop generation?')) {
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
			alert('There is no completed executions for the data source yet');
		}
	}

	return commonUtils.build('pathway-executions', PathwayExecutions, view);
});