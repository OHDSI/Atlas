define([
	'knockout',
	'components/Chart',
	'components/Component',
	'atlascharts',
	'text!components/charts/chart.html',
	'utils/CommonUtils',
	'utils/ChartUtils',
], function (
	ko,
	Chart,
	Component,
	atlascharts,
	view,
	commonUtils,
	ChartUtils
) {
	class Treemap extends Chart {
		constructor(params, element) {
			super(params, element);
			this.renderer = new atlascharts.treemap();
			this.storeParams(params);
			if (params.data()) {
				const hierarchy = ChartUtils.buildHierarchyFromJSON(params.data(), this.threshold, params.aggProperty)
				this.rawData(hierarchy);
			}
		}

		storeParams(params) {
			super.storeParams(params);
			const width = this.width || this.minHeight;
			this.threshold = params.format.minimumArea / (width * this.minHeight);
		}

	}

	return commonUtils.build('treemap', Treemap, view);
});
