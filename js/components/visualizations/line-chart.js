define(
  [
    'knockout',
    'text!./line-chart.html',
    'utils/BemHelper',
    'utils/ChartUtils',
    'less!./line-chart.less',
    'extensions/bindings/lineChart',
  ],
  function (ko, view, BemHelper, ChartUtils) {

    const componentName = 'line-chart';

    class LineChart {
      constructor(params, element) {
        this.element = element;
        this.lineChart = typeof params.lineChart === 'function' ? params.lineChart() : params.lineChart;

        const bemHelper = new BemHelper(componentName);
        this.classes = bemHelper.run.bind(bemHelper);

        this.setupDisplayObserver(this.element);

        this.saveAsPng = this.saveAsPng.bind(this);
        this.setChartRenderMethod = this.setChartRenderMethod.bind(this);
      }

      saveAsPng() {
        ChartUtils.downloadSvgAsPng(this.element);
      }

      setChartRenderMethod(fu) {
        this.renderChart = fu;
      }

      // Required to track changes of element's visibility,
      // to re-render chart when initially it was hidden (so height was calculated as zero) and then displayed (height became non-zero value)
      setupDisplayObserver(element) {
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.attributeName === 'style' && (mutation.oldValue || '').includes('display: none;') && mutation.target.style.display !== 'none') {
              this.renderChart(); //(element, valueAccessor);
            }
          });
        });
        const config = { attributes: true, attributeOldValue: true };
        observer.observe(element, config);
      }
    }

    const createViewModel =  function(params, componentInfo) {
      return new LineChart(params, componentInfo.element);
    };

    const component = {
      viewModel: { createViewModel },
      template: view,
    };

    ko.components.register(componentName, component);
    return component;
  }
);
