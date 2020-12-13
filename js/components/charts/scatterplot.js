define([
	'knockout',
	'components/Chart',
	'components/Component',
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
	class Scatterplot extends Chart {
		constructor(params, element) {
			super(params, element);
			this.renderer = new atlascharts.scatterplot();
		}
	}

	return commonUtils.build('scatterplot', Scatterplot, view);
});
