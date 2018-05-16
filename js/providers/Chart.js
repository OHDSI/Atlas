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
    constructor() {
      super();
      this.view = view;
      this.container = ko.observable();
      this.data = ko.observable();
      this.container.subscribe(this.draw.bind(this));
      this.data.subscribe(this.draw.bind(this));
      this.format = {};
      this.setContainer = this.setContainer.bind(this);
    }

    setContainer(element) {
      this.container(element);
      this.width = this.container().getBoundingClientRect().width;
    }
    
    draw() {
      if (!this.container() || !this.data()) {
        return false;
      }
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

    render(params) {
      this.storeParams(params);
      this.data(params.data());
    }
  }

  return Chart;
});
      