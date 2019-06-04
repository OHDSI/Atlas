define([
	'knockout',
	'components/Component',
	'utils/CommonUtils',
	'text!./inclusion-reports.html',
	'components/tabs',
	'./feasibility-report-viewer-with-header'
], function (
	ko,
	Component,
	commonUtils,
	view
) {
	class InclusionReports extends Component {
		constructor(params) {
			super();

			this.params = params;

			this.tabs = [
				{
					title: 'By Person',
					componentName: 'feasibility-report-viewer-with-header',
					componentParams: {
						sourceName: params.sourceName,
						report: ko.computed(() => params.report() && params.report().byPerson)
					},
				},
				{
					title: 'By Events',
					componentName: 'feasibility-report-viewer-with-header',
					componentParams: {
						sourceName: params.sourceName,
						report: ko.computed(() => params.report() && params.report().byEvent)
					},
				}
			];
		}
	}

	return commonUtils.build('inclusion-reports', InclusionReports, view);
});
