define([
	'knockout',
	'text!./plp-generation.html',
	'utils/CommonUtils',
	'utils/AutoBind',
	'utils/DatatableUtils',
	'components/Component',
	'../PermissionService',
	'services/Source',
	'lodash',
	'less!./plp-generation.less',
], function(
	ko,
	view,
	commonUtils,
	AutoBind,
	datatableUtils,
	Component,
	PermissionService,
	SourceService,
	lodash,
){

	class PlpGeneration extends AutoBind(Component) {

		constructor(params) {
			super(params);

			this.loading = ko.observable();
			this.expandedSection = ko.observable();

			this.analysisId = params.analysisId;

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
					// render: (s, p, d) => s === 'FAILED' ? `<a href='#' data-bind="css: $component.classes('status-link'), click: () => $component.showExitMessage('${d.sourceKey}', ${d.id})">${s}</a>` : s,
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
					// render: (s, p, d) => {
					// 	return d.status === this.ccGenerationStatusOptions.COMPLETED ? `<a href='#' data-bind="css: $component.classes('reports-link'), click: $component.goToResults.bind(null, id)">View reports</a>` : '-'; // ${d.reportCount}
					// }
				},
			];
			this.executionGroups = ko.observableArray([]);
			this.loadData();
		}

		isGeneratePermitted(sourceKey) {
			return PermissionService.isPermittedGenerate(sourceKey, this.analysisId());
		}

		isResultsViewPermitted(sourceKey) {
			return true;
		}

		loadData() {
			this.loading(true);
			Promise.all([
				SourceService.loadSourceList(),
			]).then(([
				allSources,
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
					group.status('COMPLETED');
				});

				}).finally(() => this.loading(false));
		}

		generate() {

		}

		toggleSection(idx) {
			this.expandedSection() === idx ? this.expandedSection(null) : this.expandedSection(idx);
		}

	}

	commonUtils.build('plp-generation', PlpGeneration, view);

});