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
	class Procedure extends TreemapReport {
		constructor(params) {
			super(params);       

			this.name = 'Procedure'; // header

			this.byFrequency = true;
			this.byType = true;
		}

        get aggProperty() {
            return constants.aggProperties.byPerson;
        }

	}

	return commonUtils.build('report-procedure', Procedure, view);
});
