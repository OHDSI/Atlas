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
	class DrugEra extends TreemapReport {
		constructor(params) {
			super(params);

			this.name = 'Drug Era'; // header
		}

        get aggProperty() {
            return constants.aggProperties.byLengthOfEra;
        }

	}

	return commonUtils.build('report-drug-era', DrugEra, view);
});
