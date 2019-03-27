define([
	'knockout',
	'pages/characterizations/services/CharacterizationService',
	'pages/characterizations/services/PermissionService',
	'pages/characterizations/const',
	'text!./characterization-executions.html',
	'appConfig',
	'services/AuthAPI',
	'moment',
	'components/Component',
	'utils/AutoBind',
	'utils/CommonUtils',
	'utils/DatatableUtils',
	'utils/ExecutionUtils',
	'services/Source',
	'lodash',
	'services/JobDetailsService',
	'services/Poll',
	'less!./characterization-executions.less',
	'./characterization-results',
	'databindings/tooltipBinding',
	'components/modal-exit-message',
], function(
	ko,
	CharacterizationService,
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
	ExecutionUtils,
	SourceService,
	lodash,
	jobDetailsService,
	PollService,
) {
	class CharacterizationViewEditExecutions extends AutoBind(Component) {
		constructor(params) {
			super();

			this.ccGenerationStatusOptions = consts.ccGenerationStatus;

			this.characterizationId = params.characterizationId;
			this.designDirtyFlag = params.designDirtyFlag;
			this.currentHash = ko.computed(() => params.design() ? params.design().hashCode : 0);

			this.isViewGenerationsPermitted = this.isViewGenerationsPermittedResolver();
			this.isExecutionPermitted = this.isExecutionPermitted.bind(this);
			this.isResultsViewPermitted = this.isResultsViewPermitted.bind(this);
			this.loading = ko.observable(false);
			this.expandedSection = ko.observable();
			this.isExecutionDesignShown = ko.observable(false);
			this.stopping = ko.observable({});
			this.isSourceStopping = (source) => this.stopping()[source.sourceKey];
			this.isExitMessageShown = ko.observable(false);
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
							PermissionService.isPermittedExportGenerationDesign(d.id) ?
							`<a href='#' data-bind="css: $component.classes('design-link'), click: () => $component.showExecutionDesign(${d.id})">${(d.hashCode || '-')}</a>${this.currentHash() === d.hashCode ? ' (same as now)' : ''}` :
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
						return d.status === this.ccGenerationStatusOptions.COMPLETED ? `<a href='#' data-bind="css: $component.classes('reports-link'), click: $component.goToResults.bind(null, id)">View reports</a>` : '-'; // ${d.reportCount}
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
				() => (this.characterizationId() ? PermissionService.isPermittedGetCCGenerations(this.characterizationId()) : true)
			);
		}

		isExecutionPermitted(sourceKey) {
			return PermissionService.isPermittedGenerateCC(this.characterizationId(), sourceKey) && !this.designDirtyFlag().isDirty();
		}

		isResultsViewPermitted(sourceKey) {
			return PermissionService.isPermittedGetCCGenerationResults(sourceKey);
		}

		getExecutionGroupStatus(submissions) {
			return submissions().find(s => s.status === this.ccGenerationStatusOptions.STARTED) ?
				this.ccGenerationStatusOptions.STARTED :
				this.ccGenerationStatusOptions.COMPLETED;
		}

		async loadData({
			silently = false
		} = {}) {
			!silently && this.loading(true);

			try {
				const ccId = this.characterizationId();
				const allSources = await SourceService.loadSourceList();
				const executionList = await CharacterizationService.loadCharacterizationExecutionList(ccId);

				let sourceList = allSources.filter(source => {
					return (source.daimons.filter(function(daimon) {
							return daimon.daimonType == "CDM";
						}).length > 0 &&
						source.daimons.filter(function(daimon) {
							return daimon.daimonType == "Results";
						}).length > 0)
				});

				sourceList = lodash.sortBy(sourceList, ["sourceName"]);

				sourceList.forEach(s => {
					let group = this.executionGroups().find(g => g.sourceKey === s.sourceKey);
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

		generate(source, lastestDesign) {
			if(lastestDesign === this.currentHash()) {
				if (!confirm('No changes have been made since last execution. Do you still want to run new one?')) {
					return false;
				}
			}

			this.stopping({...this.stopping(), [source]: false});
			const executionGroup = this.executionGroups().find(g => g.sourceKey === source);
			executionGroup.status(this.ccGenerationStatusOptions.PENDING);

			ExecutionUtils.StartExecution(executionGroup)
				.then(() => CharacterizationService.runGeneration(this.characterizationId(), source))
				.then((data) => {
					jobDetailsService.createJob(data);
					this.loadData();
				})
				.catch(() => {
					executionGroup.status(this.getExecutionGroupStatus(executionGroup.submissions));
				});
		}

		cancelGenerate(source) {
			this.stopping({...this.stopping(), [source.sourceKey]: true});
			if (confirm('Do you want to stop generation?')) {
				CharacterizationService.cancelGeneration(this.characterizationId(), source.sourceKey);
			}
		}

		showExecutionDesign(executionId) {
			this.executionDesign(null);
			this.isExecutionDesignShown(true);

			CharacterizationService
				.loadCharacterizationExportDesignByGeneration(executionId)
				.then(res => {
					this.executionDesign(res);
					this.loading(false);
				});
		}

		showExitMessage(sourceKey, id) {
			const group = this.executionGroups().find(g => g.sourceKey === sourceKey) || { submissions: ko.observableArray() };
			const submission = group.submissions().find(s => s.id === id);
			if (submission && submission.exitMessage) {
				this.exitMessage(submission.exitMessage);
				this.isExitMessageShown(true);
			}
		}

		toggleSection(idx) {
			this.expandedSection() === idx ? this.expandedSection(null) : this.expandedSection(idx);
		}

		goToResults(executionId) {
			commonUtils.routeTo('/cc/characterizations/' + this.characterizationId() + '/results/' + executionId);
		}

		goToLatestResults(sourceKey) {
			const sg = this.executionGroups().find(g => g.sourceKey === sourceKey);
			if (sg) {
				const submissions = [...sg.submissions()];
				if (submissions.length > 0) {
					submissions.sort((a, b) => b.endTime - a.endTime); // sort descending
					const latestExecutedSubmission = submissions.find(s => s.status === this.ccGenerationStatusOptions.COMPLETED);
					if (latestExecutedSubmission) {
						this.goToResults(latestExecutedSubmission.id);
						return;
					}
				}
			}
			alert('There is no completed executions for the data source yet');
		}
	}

	return commonUtils.build('characterization-view-edit-executions', CharacterizationViewEditExecutions, view);
});