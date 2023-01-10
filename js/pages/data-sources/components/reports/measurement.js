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
	class Measurement extends TreemapReport {
		constructor(params) {
			super(params);       

			this.name = 'Measurement'; // header

			this.byFrequency = true;
			this.byUnit = true;
			this.byType = true;
			this.byValueAsConcept = true;
			this.byOperator = true;
		}

        get aggProperty() {
            return constants.aggProperties.byPerson;
        }

	}

	return commonUtils.build('report-measurement', Measurement, view);
});
