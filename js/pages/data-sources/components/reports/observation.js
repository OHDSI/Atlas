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
	class Observation extends TreemapReport {
		constructor(params) {
			super(params);       
			
			this.aggProperty = constants.aggProperties.byPerson;
			this.byFrequency = true;
			this.byType = true;
			this.byValueAsConcept = true;
			this.byQualifier = true;
		}

	}

	return commonUtils.build('observation', Observation, view);
});
