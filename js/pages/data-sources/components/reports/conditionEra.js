define([
	'knockout',
	'text!./treemap.html',
	'providers/Component',
	'pages/data-sources/classes/Treemap',
	'pages/data-sources/const',
	'utils/CommonUtils',
	'components/heading',
	'components/charts/treemap',
	'pages/data-sources/components/reports/treemapDrilldown',
], function (
	ko,
	view,
	Component,
	TreemapReport,
	constants,
	commonUtils
) {
	class ConditionEra extends TreemapReport {
		constructor(params) {
			super(params);
			
			this.name = 'Condition Era'; // header

			this.aggProperty = constants.aggProperties.byLengthOfEra;
		}

	}

	return commonUtils.build('report-condition-era', ConditionEra, view);
});
