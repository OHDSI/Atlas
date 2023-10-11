define(["knockout", "text!./DateAdjustmentTemplate.html", "../InputTypes/DateAdjustment"], function (
    ko,
    componentTemplate,
    DateAdjustment
  ) {
    function DateAdjustmentViewModel(params) {
      var self = this;
      self.DateAdjustment = params.DateAdjustment;     
      self.dateOptions = [
        {
          id: DateAdjustment.START_DATE,
          name: ko.i18n('options.startDate', 'start date'),
        },
        {
            id: DateAdjustment.END_DATE,
            name: ko.i18n('options.endDate', 'end date'),
        }
      ];
    }
  
    // return compoonent definition
    return {
      viewModel: DateAdjustmentViewModel,
      template: componentTemplate,
    };
  });
  