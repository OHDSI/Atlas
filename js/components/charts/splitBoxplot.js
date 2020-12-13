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
	class SplitBoxplot extends Chart {
		constructor(params, element) {
			super(params, element);
			this.renderer = new atlascharts.splitBoxplot();
		}
	}

	return commonUtils.build('split-boxplot', SplitBoxplot, view);
});
