define([
  "knockout",
  "text!./NumericRangeTemplate.html",
  "databindings/autoGrowInput",
], function (ko, componentTemplate) {
  function NumericRangeViewModel(params) {
    var self = this;
    self.Range = params.Range; // this will be a NumericRange input type.

    self.operationOptions = [
      {
        id: "lt",
        name: ko.i18n('components.numericRange.lessThan', 'Less Than'),
      },
      {
        id: "lte",
        name: ko.i18n('components.numericRange.lessOrEqualTo', 'Less or Equal To'),
      },
      {
        id: "eq",
        name: ko.i18n('components.numericRange.equalTo', 'Equal To'),
      },
      {
        id: "gt",
        name: ko.i18n('components.numericRange.greaterThan', 'Greater Than'),
      },
      {
        id: "gte",
        name: ko.i18n('components.numericRange.greaterOrEqualTo', 'Greater or Equal To'),
      },
      {
        id: "bt",
        name: ko.i18n('components.numericRange.between', 'Between'),
      },
      {
        id: "!bt",
        name: ko.i18n('components.numericRange.notBetween', 'Not Between'),
      },
    ];
  }

  // return compoonent definition
  return {
    viewModel: NumericRangeViewModel,
    template: componentTemplate,
  };
});
