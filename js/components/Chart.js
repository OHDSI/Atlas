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
      this.chartName = params.chartName ? params.chartName : '';
      this.reportName = ko.unwrap(params.reportName);
      this.fileName = ko.computed (() => {
         const fileName = this.reportName ? `${ko.unwrap(params.reportName)}_${this.chartName}`.replace(/ /g, '') : 'untitled';
         return fileName.length > 90 ? fileName.slice(0,90) : fileName;
      });

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
			ChartUtils.downloadSvgAsPng(svg, this.fileName() || "untitled.png");
		}
		exportSvg() {
            const svg = this.container.element.querySelector('svg');
            ChartUtils.downloadSvg(svg, this.fileName() + ".svg" || "untitled.svg");
        }
		dispose() {
			this.renderer && this.renderer.dispose();
		}

  }

  return Chart;
});
      