define([
	'knockout',
	'const',
	'components/Component',
	'services/PluginRegistry',
	'./const',
	'utils/CommonUtils',
	'text!./cohort-reports.html',
	'components/tabs',
	'./inclusion-report'
], function (
	ko,
	globalConstants,
	Component,
	PluginRegistry,
	constants,
	commonUtils,
	view
) {

	PluginRegistry.add(globalConstants.pluginTypes.COHORT_REPORT, {
		title: ko.i18n('cohortDefinitions.cohortreports.inclusionReport', 'Inclusion Report'),
		priority: 1,
		html: `<cohort-report-inclusion params="{ sourceKey: sourceKey, cohortId: cohortId, isViewDemographic: isViewDemographic, ccGenerateId: ccGenerateId }"></cohort-report-inclusion>`
	});

	class CohortReports extends Component {
		constructor(params) {
			super();

			this.sourceKey = ko.computed(() => params.source() && params.source().sourceKey);
			this.cohortId = ko.computed(() => params.cohort().id());
			this.isViewDemographic = ko.computed(() => params.source() && params.source().viewDemographic());
			this.ccGenerateId = ko.computed(() => params.infoSelected() && params.infoSelected().ccGenerateId());
			
			const componentParams =  {
				sourceKey: this.sourceKey,
				cohortId: this.cohortId,
				isViewDemographic: this.isViewDemographic,
				ccGenerateId: this.ccGenerateId,
			};

			this.tabs = PluginRegistry.findByType(globalConstants.pluginTypes.COHORT_REPORT).map(t => ({ ...t, componentParams }));
			
			if (this.isViewDemographic()) {
				this.tabs.push({
					title: ko.i18n('cohortDefinitions.cohortreports.tabs.byPerson3', 'Demographics'),
					componentName: 'demographic-report',
					componentParams: {
						...componentParams,
						reportType: constants.INCLUSION_REPORT.BY_DEMOGRAPHIC,
						buttons: null,
						tableDom: "Blfiprt"
					}
				});
			}		
		}

		dispose() {
			this.sourceKey.dispose();
			this.cohortId.dispose();
			this.isViewDemographic.dispose();
			this.ccGenerateId.dispose();
		}
	}

	return commonUtils.build('cohort-reports', CohortReports, view);
});
