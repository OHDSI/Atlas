define([
  "knockout",
  "text!./DateOffsetStrategyTemplate.html",
  "../options",
], function (ko, template, options) {
  function DateOffsetStrategyViewModel(params) {
    var self = this;
    self.options = options;

    self.strategy = ko.pureComputed(function () {
      return ko.utils.unwrapObservable(params.strategy).DateOffset;
    });

    self.fieldOptions = [
      { id: "StartDate", name: ko.i18n('options.startDate', 'start date') },
      { id: "EndDate", name: ko.i18n('options.endDate', 'end date') },
    ];
  }

  // return compoonent definition
  return {
    viewModel: DateOffsetStrategyViewModel,
    template: template,
  };
});
