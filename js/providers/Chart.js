define([
  'knockout',
  'providers/Component',
  'text!components/charts/chart.html',
  'const',
  'components/empty-state',
], function (
  ko,
  Component,
  view,
  constants,
) {
  class Chart extends Component {
    static get view() {
      return view;
    }

    constructor(params) {
      super(params);
      this.container = ko.observable();
      this.data = ko.observable();
      this.container.subscribe(() => this.draw());
      this.data.subscribe(() => this.draw());
      this.format = {};
      this.storeParams(params);
      this.data(params.data());
    }
    
    draw() {
      if (!this.container() || !this.data()) {
        return false;
      }
      this.width = this.container().getBoundingClientRect().width;
      this.chart.render(
        this.prepareData(this.data()),
        this.container(),
        this.width,
        this.minHeight,
        this.format
      );
    }

    prepareData(rawData) {
      return rawData;
    }

    storeParams(params) {
      this.minHeight = params.minHeight || constants.minChartHeight;
      this.format = params.format;
    }

  }

  return Chart;
});
      