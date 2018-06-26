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
	class Line extends Chart {
		constructor(params) {
			super(params);
			this.renderer = new atlascharts.line();
		}
	}

	return commonUtils.build('atlasline', Line, view);
});
