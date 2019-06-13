define([
	'knockout',
	'components/Component',
	'utils/CommonUtils',
	'./feasibility-report-viewer-with-header'
], function (
	ko,
	Component,
	commonUtils,
) {
	class CohortInclusionReport extends Component {

		constructor(params) {
			super();

			this.tabs = [
				{
					title: 'By Person',
					componentName: 'feasibility-report-viewer-with-header',
					componentParams: params,
				},
				{
					title: 'By Events',
					componentName: 'feasibility-report-viewer-with-header',
					componentParams: params,
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