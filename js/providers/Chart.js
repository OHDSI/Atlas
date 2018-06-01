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
      this.renderer = null; // atlascharts
      this.rawData = ko.observable();
      this.format = {};
      this.storeParams(params);
      this.rawData(params.data());
      this.data = ko.computed(() => {
        return this.prepareData(this.rawData());
      });
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
      