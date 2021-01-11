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
	class Donut extends Chart {
		constructor(params, element) {
			super(params, element);
			this.renderer = new atlascharts.donut();
		}
	}

	return commonUtils.build('donut', Donut, view);
});
