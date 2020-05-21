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
		html: `<cohort-report-inclusion params="{ sourceKey: sourceKey, cohortId: cohortId }"></cohort-report-inclusion>`
	});

	class CohortReports extends Component {
		constructor(params) {
			super();

			this.sourceKey = ko.computed(() => params.source() && params.source().sourceKey);
			this.cohortId = ko.computed(() => params.cohort().id());

			const componentParams =  {
				sourceKey: this.sourceKey,
				cohortId: this.cohortId
			};

			this.tabs = PluginRegistry.findByType(globalConstants.pluginTypes.COHORT_REPORT).map(t => ({ ...t, componentParams }));
		}

		dispose() {
			this.sourceKey.dispose();
			this.cohortId.dispose();
		}
	}

	return commonUtils.build('cohort-reports', CohortReports, view);
});
