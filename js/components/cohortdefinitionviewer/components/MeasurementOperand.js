define([
  "knockout",
  "text!./MeasurementOperandTemplate.html",
], function (
  ko,
  template,
){
  function MeasurementOperandViewModel(params) {
    var self = this;

    self.expression = ko.unwrap(params.expression);
    var criteria = ko.unwrap(params.criteria);
    self.Criteria = criteria;
    const measurement = criteria.Measurement;
    self.CodesetId = measurement.Measurement && measurement.Measurement.CodesetId;
    self.ValueAsNumber = criteria.ValueAsNumber;
  }

  return {
    viewModel: MeasurementOperandViewModel,
    template: template,
  };
});