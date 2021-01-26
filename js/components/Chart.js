define([
  'knockout',
  'components/Component',
	'utils/AutoBind',
	'utils/ChartUtils',
  'const',
	'utils/BemHelper',	
  'components/empty-state',
	'less!./charts/chart.less'
], function (
  ko,
  Component,
	AutoBind,
	ChartUtils,
  constants,
	BemHelper
) {
  class Chart extends AutoBind(Component) {
    constructor(params, container) {
      super(params);
			const bemHelper = new BemHelper('Chart');
      this.chartClasses = bemHelper.run.bind(bemHelper);
      this.renderer = null; // atlascharts
      this.rawData = ko.observable();
      this.format = {};
      this.storeParams(params);
      this.rawData(params.data());
      this.data = ko.computed(() => {
        return this.prepareData(this.rawData());
      });
			this.container = container;
			this.filename = ko.unwrap(params.filename);
    }

    prepareData(rawData) {
      return rawData;
    }

    storeParams(params) {
      this.minHeight = params.minHeight || constants.minChartHeight;
      this.format = params.format;
    }
		
		export() {
			const svg = this.container.element.querySelector('svg');
			ChartUtils.downloadSvgAsPng(svg, this.filename || "untitled.png");
		}
		
		dispose() {
			this.renderer && this.renderer.dispose();
		}

  }

  return Chart;
});
      