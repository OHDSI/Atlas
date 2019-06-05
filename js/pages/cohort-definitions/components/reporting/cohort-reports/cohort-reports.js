define([
	'knockout',
	'components/Component',
	'./const',
	'utils/CommonUtils',
	'utils/CustomComponentsUtils',
	'text!./cohort-reports.html',
	'components/tabs',
	'./inclusion-reports'
], function (
	ko,
	Component,
	constants,
	commonUtils,
	customComponentsUtils,
	view
) {
	class CohortReports extends Component {
		constructor(params) {
			super();

			this.sourceKey = ko.computed(() => params.source() && params.source().sourceKey);
			this.cohortId = ko.computed(() => params.cohort() && params.cohort().id());

			const componentParams =  {
				sourceKey: this.sourceKey,
				cohortId: this.cohortId
			};

			const reports = customComponentsUtils.getCustomComponentsByType(
				constants.COHORT_REPORT_COMPONENT_TYPE,
				Object.keys(componentParams)
			);

			this.tabs = reports
				.map(r => ({
					...r,
					componentParams
				}))
				.sort((a, b) => (a.PRIORITY > b.PRIORITY) ? 1 : -1);
		}

		dispose() {
			this.sourceKey.dispose();
			this.cohortId.dispose();
		}
	}

	return commonUtils.build('cohort-reports', CohortReports, view);
});
