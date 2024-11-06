define([
  "knockout",
  "../options",
  "text!./MeasurementOperandTemplate.html",
  "less!./MeasurementOperand.less",
], function (
  ko,
  options,
  template,
) {

  function MeasurementOperandViewModel(params) {
    var self = this;
    self.expression = ko.unwrap(params.expression);
    var criteria = ko.unwrap(params.criteria);
    self.Measurement = criteria.Measurement;
    self.Operator = criteria.Operator;
    self.Limit = criteria.Limit;
    self.SameVisit = criteria.SameVisit;
    self.ValueAsNumber = criteria.ValueAsNumber;
    self.options = options;
  }

  return {
    viewModel: MeasurementOperandViewModel,
    template: template,
  };
});