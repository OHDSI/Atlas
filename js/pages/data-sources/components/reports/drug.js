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
	class Drug extends TreemapReport {
		constructor(params) {
			super(params);
			 
			this.name = 'Drug'; // header

			this.byFrequency = true;
			this.byType = true;
			this.chartFormats.table.columns.splice(1, 0,
				{
					title: ko.i18n('columns.ingredient', 'Ingredient'),
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
