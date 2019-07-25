define([
	'knockout',
	'components/Component',
	'./const',
	'utils/CommonUtils',
	'./feasibility-report-viewer-with-header'
], function (
	ko,
	Component,
	constants,
	commonUtils,
) {
	class CohortInclusionReport extends Component {

		constructor(params) {
			super();

			this.tabs = [
				{
					title: 'By Person',
					componentName: 'feasibility-report-viewer-with-header',
					componentParams: { ...params, reportType: constants.INCLUSION_REPORT.BY_PERSON },
				},
				{
					title: 'By Events',
					componentName: 'feasibility-report-viewer-with-header',
					componentParams: { ...params, reportType: constants.INCLUSION_REPORT.BY_EVENT },
				}
			];
		}
	}

	return commonUtils.build(
		'cohort-report-inclusion',
		CohortInclusionReport,
		`<tabs params="tabs: $component.tabs, modifiers: ['header-right', 'header-sm', 'nested']"></tabs>`
	);
});