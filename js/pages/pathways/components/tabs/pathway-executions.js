define([
	'knockout',
	'../../PathwayService',
	'../../PermissionService',
	'../../const',
	'text!./pathway-executions.html',
	'providers/Component',
	'providers/AutoBind',
	'utils/CommonUtils',
	'utils/DatatableUtils',
	'services/SourceService',
	'less!./pathway-executions.less',
	//'./pathway-results'
], function(
	ko,
	PathwayService,
	PermissionService,
	consts,
	view,
	Component,
	AutoBind,
	commonUtils,
	datatableUtils,
	SourceService
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
				() => (this.analysisId() ? PermissionService.isPermittedListGenerations(this.analysisId()) : true)
			);
		}

		isGenerationPermitted(sourceKey) {
			return PermissionService.isPermittedGenerate(this.analysisId(), sourceKey);
		}

		isResultsViewPermitted(sourceKey) {
			return PermissionService.isPermittedResults(sourceKey);
		}

		loadData({silently = false} = {}) {
			!silently && this.loading(true);

			const analysisId = this.analysisId();

			Promise.all([
				SourceService.loadSourceList(),
				PathwayService.listExecutions(analysisId)
			]).then(([
				allSources,
				executionList
			]) => {
				const sourceList = allSources.filter(source => {
					return (source.daimons.filter(function (daimon) { return daimon.daimonType == "CDM"; }).length > 0
							&& source.daimons.filter(function (daimon) { return daimon.daimonType == "Results"; }).length > 0)
				});				
				
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
					group.status(group.submissions().find(s => s.status === this.pathwayGenerationStatusOptions.STARTED) ?
						this.pathwayGenerationStatusOptions.STARTED :
						this.pathwayGenerationStatusOptions.COMPLETED);
					
				});
				
				this.loading(false);
			});
		}

		generate(source) {
			let confirmPromise;

			if ((this.executionGroups().find(g => g.sourceKey === source) || {}).status === this.pathwayGenerationStatusOptions.STARTED) {
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
				.then(() => PathwayService.generate(this.analysisId(), source))
				.then(() => this.loadData())
				.catch(() => {});
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