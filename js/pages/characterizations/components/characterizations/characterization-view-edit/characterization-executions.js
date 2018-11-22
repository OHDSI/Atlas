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
	'services/Source',
	'lodash',
	'services/JobDetailsService',
	'less!./characterization-executions.less',
	'./characterization-results',
	'databindings/tooltipBinding'
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
	SourceService,
	lodash,
	jobDetailsService
) {
	class CharacterizationViewEditExecutions extends AutoBind(Component) {
		constructor(params) {
			super();

			this.ccGenerationStatusOptions = consts.ccGenerationStatus;

			this.characterizationId = params.characterizationId;
			const currentHash = ko.computed(() => params.design().hash);
			this.designDirtyFlag = params.designDirtyFlag;

			this.isViewGenerationsPermitted = this.isViewGenerationsPermittedResolver();
			this.isExecutionPermitted = this.isExecutionPermitted.bind(this);
			this.isResultsViewPermitted = this.isResultsViewPermitted.bind(this);

			this.loading = ko.observable(false);
			this.expandedSection = ko.observable();
			this.isExecutionDesignShown = ko.observable(false);

			this.execColumns = [{
					title: 'Date',
					className: this.classes('col-exec-date'),
					render: datatableUtils.getDateFieldFormatter('startTime'),
					type: 'date'
				},
				{
					title: 'Design',
					className: this.classes('col-exec-checksum'),
					render: (s, p, d) => {
						return (
							PermissionService.isPermittedExportGenerationDesign(d.id) ?
							`<a data-bind="css: $component.classes('design-link'), click: () => $component.showExecutionDesign(${d.id})">${(d.hashCode || '-')}</a>${currentHash() === d.hashCode ? ' (same as now)' : ''}` :
							(d.hashCode || '-')
						);
					}
				},
				{
					title: 'Status',
					data: 'status',
					className: this.classes('col-exec-status'),
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
						return d.status === this.ccGenerationStatusOptions.COMPLETED ? `<a data-bind="css: $component.classes('reports-link'), click: $component.goToResults.bind(null, id)">View reports</a>` : '-'; // ${d.reportCount}
					}
				}
			];

			this.executionGroups = ko.observableArray([]);
			this.executionDesign = ko.observable(null);

			if (this.isViewGenerationsPermitted()) {
				this.loadData();
				this.intervalId = setInterval(() => this.loadData({
					silently: true
				}), 10000)
			}
		}

		dispose() {
			clearInterval(this.intervalId);
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

		loadData({
			silently = false
		} = {}) {
			!silently && this.loading(true);

			const ccId = this.characterizationId();

			Promise.all([
				SourceService.loadSourceList(),
				CharacterizationService.loadCharacterizationExecutionList(ccId)
			]).then(([
				allSources,
				executionList
			]) => {
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
					group.status(group.submissions().find(s => s.status === this.ccGenerationStatusOptions.STARTED) ?
						this.ccGenerationStatusOptions.STARTED :
						this.ccGenerationStatusOptions.COMPLETED);

				})
				this.loading(false);
			});
		}

		generate(source) {
			let confirmPromise;

			if ((this.executionGroups().find(g => g.sourceKey === source) || {}).status === this.ccGenerationStatusOptions.STARTED) {
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

			confirmPromise
				.then(() => CharacterizationService.runGeneration(this.characterizationId(), source))
				.then((data) => {
					jobDetailsService.createJob(data);
					this.loadData()
				})
				.catch(() => {});
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