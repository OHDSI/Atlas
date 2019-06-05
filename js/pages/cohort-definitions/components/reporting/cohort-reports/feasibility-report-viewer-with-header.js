define([
	'knockout',
	'components/Component',
	'services/CohortDefinition',
	'utils/CommonUtils',
	'text!./feasibility-report-viewer-with-header.html'
], function (
	ko,
	Component,
	CohortDefinitionService,
	commonUtils,
	view
) {
	class FeasibilityReportViewerWithHeader extends Component {
		constructor(params) {
			super();

			this.reportType = params.reportType;
			this.source = params.source;
			this.cohortId = params.cohortId;

			this.isLoading = ko.observable(false);
			this.report = ko.observable();

			this.loadReport();
			this.source.subscribe(s => s && this.loadReport());
			this.cohortId.subscribe(c => c && this.loadReport());
		}

		loadReport() {
			this.isLoading(true);

			CohortDefinitionService
				.getReport(this.cohortId(), this.source().sourceKey, this.reportType)
				.then(report => {
					this.report(report);
					this.isLoading(false);
				});
		}
	}

	return commonUtils.build('feasibility-report-viewer-with-header', FeasibilityReportViewerWithHeader, view);
});
