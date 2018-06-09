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
	commonUtils,
) {
	class Treemap extends Chart {
		constructor(params) {
			super(params);
			this.renderer = new atlascharts.treemap();
			this.storeParams(params);
			if (params.data()) {
				const hierarchy = commonUtils.buildHierarchyFromJSON(params.data(), this.threshold, params.aggProperty)
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
