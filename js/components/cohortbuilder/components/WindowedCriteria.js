define([
  "knockout",
  "text!./WindowedCriteria.html",
  "../InputTypes/Window",
  "components/Component",
  "utils/AutoBind",
  "utils/CommonUtils",
  "../utils",
  "../options",
  "less!./WindowedCriteria.less",
], function (
  ko,
  view,
  Window,
  Component,
  AutoBind,
  commonUtils,
  utils,
  options
) {
  class WindowedCriteria extends AutoBind(Component) {
    constructor(params) {
      super(params);
      this.expression = params.expression;
      this.criteria = params.criteria;
      this.disableObservationPeriod = params.disableObservationPeriod || false;
      if (this.disableObservationPeriod && params.defaultObservationPeriod) {
        this.criteria().IgnoreObservationPeriod(
          params.defaultObservationPeriod
        );
      }
      this.options = options;
    }

    getCriteriaComponent(data) {
      return utils.getCriteriaComponent(data);
    }

    addEndWindow() {
      this.criteria().EndWindow(new Window({ UseEndWindow: true }));
    }

    removeEndWindow() {
      this.criteria().EndWindow(null);
    }
  }

  commonUtils.build("windowed-criteria", WindowedCriteria, view);
});
