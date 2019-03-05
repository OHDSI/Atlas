define([
  'knockout',
  'components/Component',
  'const',
  'components/empty-state',
], function (
  ko,
  Component,
  constants,
) {
  class Chart extends Component {
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
		
		dispose() {
			this.renderer && this.renderer.dispose();
		}

  }

  return Chart;
});
      