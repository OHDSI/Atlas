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
	class Procedure extends TreemapReport {
		constructor(params) {
			super(params);       

			this.aggProperty = constants.aggProperties.byPerson;
			this.byFrequency = true;
			this.byType = true;
		}

	}

	return commonUtils.build('procedure', Procedure, view);
});
