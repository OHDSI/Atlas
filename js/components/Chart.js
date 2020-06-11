define([
  'knockout',
  'components/Component',
	'utils/AutoBind',
	'utils/ChartUtils',
  'const',
  'components/empty-state',
], function (
  ko,
  Component,
	AutoBind,
	ChartUtils,
  constants,
) {
  class Chart extends AutoBind(Component) {
    constructor(params, container) {
      super(params);
      this.renderer = null; // atlascharts
      this.rawData = ko.observable();
      this.format = {};
      this.storeParams(params);
      this.rawData(params.data());
      this.data = ko.computed(() => {
        return this.prepareData(this.rawData());
      });
			this.container = container;
			this.filename = params.filename || 'untitledChart.png';
    }

    prepareData(rawData) {
      return rawData;
    }

    storeParams(params) {
      this.minHeight = params.minHeight || constants.minChartHeight;
      this.format = params.format;
    }
		
		export() {
			console.warn('Export not implemented');
			const svg = this.container.element.querySelector('svg');
			ChartUtils.downloadAsPng(svg, this.filename || "untitled.png");
		}
		
		dispose() {
			this.renderer && this.renderer.dispose();
		}

  }

  return Chart;
});
      