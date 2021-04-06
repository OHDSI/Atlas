define(["knockout", "text!./DateRangeTemplate.html"], function (
  ko,
  componentTemplate
) {
  function DateRangeViewModel(params) {
    var self = this;
    self.Range = params.Range; // this will be a NumericRange input type.

    self.operationOptions = [
      {
        id: "lt",
        name: ko.i18n('components.dateRange.before', 'Before'),
      },
      {
        id: "lte",
        name: ko.i18n('components.dateRange.onOrBefore', 'On or Before'),
      },
      {
        id: "eq",
        name: ko.i18n('components.dateRange.on', 'On'),
      },
      {
        id: "gt",
        name: ko.i18n('components.dateRange.after', 'After'),
      },
      {
        id: "gte",
        name: ko.i18n('components.dateRange.onOrAfter', 'On or After'),
      },
      {
        id: "bt",
        name: ko.i18n('components.dateRange.between', 'Between'),
      },
      {
        id: "!bt",
        name: ko.i18n('components.dateRange.notBetween', 'Not Between'),
      },
    ];
  }

  // return compoonent definition
  return {
    viewModel: DateRangeViewModel,
    template: componentTemplate,
  };
});
