define([
	'./const',
	'utils/CustomComponentsUtils',
	'./feasibility-report-viewer-with-header'
], function (constants, CustomComponentsUtils) {

	const feasibilityReportViewerTemplate = `
		<feasibility-report-viewer-with-header params="reportType: reportType, sourceKey: $parent.sourceKey, cohortId: $parent.cohortId">
		</feasibility-report-viewer-with-header>
	`;

	class BaseCohortInclusionReport extends HTMLElement {
		static TYPE = constants.COHORT_REPORT_COMPONENT_TYPE;

		getTemplate() {
			return feasibilityReportViewerTemplate;
		}

		connectedCallback() {
			this.innerHTML = this.getTemplate();
		}
	}

	function decorateWithReportType(template, type) {
		return `
			<div data-bind="with: { reportType: '${type}' }">
				${template}
			</div>
		`;
	}

	const FEASIBILITY_BY_PERSON = `${constants.COHORT_REPORT_COMPONENT_TYPE}-feasibility-by-person`;

	CustomComponentsUtils.defineOnce(FEASIBILITY_BY_PERSON, class extends BaseCohortInclusionReport {
		static TITLE = 'By Person';
		static PRIORITY = 0;

		getTemplate() {
			return decorateWithReportType(super.getTemplate(), constants.INCLUSION_REPORT.BY_PERSON);
		}
	});

	const FEASIBILITY_BY_EVENTS = `${constants.COHORT_REPORT_COMPONENT_TYPE}-feasibility-by-events`;

	CustomComponentsUtils.defineOnce(FEASIBILITY_BY_EVENTS, class extends BaseCohortInclusionReport {
		static TITLE = 'By Events';
		static PRIORITY = 1;

		getTemplate() {
			return decorateWithReportType(super.getTemplate(), constants.INCLUSION_REPORT.BY_EVENT);
		}
	});
});
