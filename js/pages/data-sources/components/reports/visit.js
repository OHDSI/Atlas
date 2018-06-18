define([
	'knockout',
	'text!./treemap.html',
	'pages/data-sources/classes/Treemap',
	'providers/Component',
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
	class Visit extends TreemapReport {
		constructor(params) {
			super(params);    
			
			this.name = 'Visit'; // header
			
			this.aggProperty = constants.aggProperties.byPerson;
		}

	}

	return commonUtils.build('report-visit', Visit, view);
});
