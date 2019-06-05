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

			this.cohortId = ko.computed(() => params.cohort().id());

			this.tabs = [
				{
					title: 'By Person',
					componentName: 'feasibility-report-viewer-with-header',
					componentParams: {
						source: params.source,
						cohortId: this.cohortId,
						reportType: constants.INCLUSION_REPORT.BY_PERSON,
					},
				},
				{
					title: 'By Events',
					componentName: 'feasibility-report-viewer-with-header',
					componentParams: {
						source: params.source,
						cohortId: this.cohortId,
						reportType: constants.INCLUSION_REPORT.BY_EVENT,
					},
				}
			];
		}

		dispose() {
			this.cohortId.dispose();
		}
	}

	return commonUtils.build('cohort-reports', CohortReports, view);
});
