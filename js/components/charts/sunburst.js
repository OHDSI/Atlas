define([
	'knockout',
	'providers/Chart',
	'providers/Component',
	'atlascharts',
	'text!components/charts/chart.html',
	'utils/CommonUtils'
], function (
	ko,
	Chart,
	Component,
	atlascharts,
	view,
	commonUtils
) {
	class Sunburst extends Chart {
		constructor(params) {
			super(params);
			this.renderer = new atlascharts.sunburst();
		}
	}

	return commonUtils.build('sunburst', Sunburst, view);
});
