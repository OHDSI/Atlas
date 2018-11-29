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
	class Drug extends TreemapReport {
		constructor(params) {
			super(params);
			 
			this.name = 'Drug'; // header

			this.byFrequency = true;
			this.byType = true;
			this.chartFormats.table.columns.splice(1, 0,
				{
					title: 'Ingredient',
					data: 'ingredient',
					className: 'treemap__tbl-col--medium'
				});
		}

        get aggProperty() {
            return constants.aggProperties.byPerson;
        }
	}

	return commonUtils.build('report-drug', Drug, view);
});
