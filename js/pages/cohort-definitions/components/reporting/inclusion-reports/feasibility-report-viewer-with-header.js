define([
	'knockout',
	'components/Component',
	'utils/CommonUtils',
	'text!./feasibility-report-viewer-with-header.html'
], function (
	ko,
	Component,
	commonUtils,
	view
) {
	class FeasibilityReportViewerWithHeader extends Component {
		constructor(params) {
			super();
			this.sourceName = params.sourceName;
			this.report = params.report;
		}
	}

	return commonUtils.build('feasibility-report-viewer-with-header', FeasibilityReportViewerWithHeader, view);
});
