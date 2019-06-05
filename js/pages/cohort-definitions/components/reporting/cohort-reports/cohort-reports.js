define([
	'knockout',
	'components/Component',
	'./const',
	'utils/CommonUtils',
	'text!./cohort-reports.html',
	'components/tabs',
	'./feasibility-report-viewer-with-header'
], function (
	ko,
	Component,
	constants,
	commonUtils,
	view
) {
	class CohortReports extends Component {
		constructor(params) {
			super();

			this.params = params;

			this.tabs = [
				{
					title: 'By Person',
					componentName: 'feasibility-report-viewer-with-header',
					componentParams: {
						source: ko.computed(() => params.source()),
						cohortId: ko.computed(() => params.cohort().id()),
						reportType: constants.INCLUSION_REPORT.BY_PERSON,
					},
				},
				{
					title: 'By Events',
					componentName: 'feasibility-report-viewer-with-header',
					componentParams: {
						source: ko.computed(() => params.source()),
						cohortId: ko.computed(() => params.cohort().id()),
						reportType: constants.INCLUSION_REPORT.BY_PERSON,
					},
				}
			];
		}
	}

	return commonUtils.build('cohort-reports', CohortReports, view);
});
