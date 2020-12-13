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
	class Boxplot extends Chart {
		constructor(params, element) {
			super(params, element);
			this.renderer = new atlascharts.boxplot();
		}

	}

	return commonUtils.build('boxplot', Boxplot, view);
});
