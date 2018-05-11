define([
  'knockout',
  'providers/Component',
  'text!../components/charts/chart.html',
  'pages/data-sources/const',
  'components/empty-state/empty-state',
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
      this.container.subscribe(this.draw.bind(this));
      this.data = ko.observable();
      this.data.subscribe(this.draw.bind(this));
      this.format = {};
      this.setContainer = this.setContainer.bind(this);
    }

    setContainer(element) {
      this.container(element);
    }
    
    draw() {
      if (!this.container() || !this.data()) {
        return false;
      }
      this.width = this.container().getBoundingClientRect().width;
      this.chart.render(
        this.data(),
        this.container(),
        this.width,
        this.minHeight,
        this.format
      );
    }

    render(params) {
      this.minHeight = params.minHeight || constants.minChartHeight;
      this.data(params.data());
      this.format = params.format;
    }
  }

  return Chart;
});
      