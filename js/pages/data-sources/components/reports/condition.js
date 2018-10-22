define([
	'knockout',
	'text!./treemap.html',
	'pages/data-sources/classes/Treemap',
	'components/Component',
	'pages/data-sources/const',
	'utils/CommonUtils',
	'components/heading',
	'components/charts/treemap',
	'pages/data-sources/components/reports/treemapDrilldown',
], function (
	ko,
	view,
	TreemapReport,
	Component,
	constants,
	commonUtils
) {
	class Condition extends TreemapReport {
		constructor(params) {
			super(params);       

			this.name = 'Condition'; // header

			this.byType = true;
		}

		get aggProperty() {
			return constants.aggProperties.byPerson;
		}

	}

	return commonUtils.build('report-condition', Condition, view);
});
