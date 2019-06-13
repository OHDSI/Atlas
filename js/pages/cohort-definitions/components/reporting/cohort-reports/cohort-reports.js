define([
	'knockout',
	'components/Component',
	'./const',
	'utils/CommonUtils',
	'text!./cohort-reports.html',
	'components/tabs',
	'./inclusion-report'
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
					title: 'Inclusion Report',
					componentName: 'cohort-report-inclusion',
					componentParams: {
						source: params.source,
						cohortId: this.cohortId,
						reportType: constants.INCLUSION_REPORT.BY_PERSON,
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
