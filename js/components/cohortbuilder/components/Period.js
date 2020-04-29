define(["knockout", "text!./PeriodTemplate.html"], function (
  ko,
  componentTemplate
) {
  function PeriodViewModel(params) {
    var self = this;
    self.Period = params.Period; // this will be a NumericRange input type.
  }

  // return compoonent definition
  return {
    viewModel: PeriodViewModel,
    template: componentTemplate,
  };
});
