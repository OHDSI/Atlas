define([
	'knockout',
	'text!./treemap.html',
	'components/reports/classes/Treemap',
	'components/Component',
	'components/reports/const',
	'utils/CommonUtils',
	'components/heading',
	'components/charts/treemap',
	'components/reports/reportDrilldown'
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
