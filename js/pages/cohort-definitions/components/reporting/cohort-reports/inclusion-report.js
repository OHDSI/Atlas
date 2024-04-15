define([
	'knockout',
	'components/Component',
	'./const',
	'utils/CommonUtils',
	'text!./inclusion-report.html',
	'./feasibility-report-viewer-with-header',
	'./demographic-report'
], function (
	ko,
	Component,
	constants,
	commonUtils,
	view,
) {
	class CohortInclusionReport extends Component {

		constructor(params) {
			super();

			this.tabs = ko.computed(() => {
				if(params.isViewDemographic()){
					return [
						{
							title: ko.i18n('cohortDefinitions.cohortreports.tabs.byPerson', 'By Person'),
							componentName: 'feasibility-report-viewer-with-header',
							componentParams: { ...params, reportType: constants.INCLUSION_REPORT.BY_PERSON },
						},
						{
							title: ko.i18n('cohortDefinitions.cohortreports.tabs.byEvents', 'By All Events'),
							componentName: 'feasibility-report-viewer-with-header',
							componentParams: { ...params, reportType: constants.INCLUSION_REPORT.BY_EVENT },
						},
						{
							title: ko.i18n('cohortDefinitions.cohortreports.tabs.byPerson3', 'Demographics'),
							componentName: 'demographic-report',
							componentParams: { ...params, reportType: constants.INCLUSION_REPORT.BY_DEMOGRAPHIC, buttons: null, tableDom: "Blfiprt" },
						},
					]
				}
				return [{
					title: ko.i18n('cohortDefinitions.cohortreports.tabs.byPerson', 'By Person'),
					componentName: 'feasibility-report-viewer-with-header',
					componentParams: { ...params, reportType: constants.INCLUSION_REPORT.BY_PERSON },
				},
				{
					title: ko.i18n('cohortDefinitions.cohortreports.tabs.byEvents', 'By All Events'),
					componentName: 'feasibility-report-viewer-with-header',
					componentParams: { ...params, reportType: constants.INCLUSION_REPORT.BY_EVENT },
				}]
				}, params?.isViewDemographic());
		}
	}

	return commonUtils.build(
		'cohort-report-inclusion',
		CohortInclusionReport,
		view
	);
});