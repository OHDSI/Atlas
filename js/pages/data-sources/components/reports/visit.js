define([
	'knockout',
	'text!./treemap.html',
	'components/reports/classes/Treemap',
	'components/Component',
	'pages/data-sources/const',
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
	class Visit extends TreemapReport {
		constructor(params) {
			super(params);    
			
			this.name = 'Visit'; // header
		}

        get aggProperty() {
            return constants.aggProperties.byPerson;
        }

	}

	return commonUtils.build('report-visit', Visit, view);
});
