define([
	'knockout',
	'components/Chart',
	'components/Component',
	'atlascharts',
	'text!./chart.html',
	'utils/CommonUtils',
	'less!./chart.less'
], function (
	ko,
	Chart,
	Component,
	atlascharts,
	view,
	commonUtils
) {
	class Sunburst extends Chart {
		constructor(params, element) {
			super(params, element);
			this.renderer = new atlascharts.sunburst();
		}
	}

	return commonUtils.build('sunburst', Sunburst, view);
});
