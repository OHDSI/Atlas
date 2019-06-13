define([
	'knockout',
	'components/Component',
	'services/PluginRegistry',
	'./const',
	'utils/CommonUtils',
	'text!./cohort-reports.html',
	'components/tabs',
	'./feasibility-report-viewer-with-header'
], function (
	ko,
	Component,
	PluginRegistry,
	constants,
	commonUtils,
	view
) {

	PluginRegistry.add(constants.COHORT_REPORT_COMPONENT_TYPE, {
		title: 'By Person',
		priority: 1,
		html: `
			<feasibility-report-viewer-with-header params="{ sourceKey: sourceKey, cohortId: cohortId, reportType: ${constants.INCLUSION_REPORT.BY_PERSON} }">
			</feasibility-report-viewer-with-header>
		`
	});

	PluginRegistry.add(constants.COHORT_REPORT_COMPONENT_TYPE, {
		title: 'By Events',
		priority: 2,
		html: `
			<feasibility-report-viewer-with-header params="{ sourceKey: sourceKey, cohortId: cohortId, reportType: ${constants.INCLUSION_REPORT.BY_EVENT} }">
			</feasibility-report-viewer-with-header>
		`,
	});

	class CohortReports extends Component {
		constructor(params) {
			super();

			this.sourceKey = ko.computed(() => params.source() && params.source().sourceKey);
			this.cohortId = ko.computed(() => params.cohort().id());

			const componentParams =  {
				sourceKey: this.sourceKey,
				cohortId: this.cohortId
			};

			this.tabs = PluginRegistry.findByType(constants.COHORT_REPORT_COMPONENT_TYPE).map(t => ({ ...t, componentParams }));
		}

		dispose() {
			this.sourceKey.dispose();
			this.cohortId.dispose();
		}
	}

	return commonUtils.build('cohort-reports', CohortReports, view);
});
