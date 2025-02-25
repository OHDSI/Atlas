define(["knockout", "text!./DateAdjustmentTemplate.html", "components/cohortbuilder/InputTypes/DateAdjustment"], function (
    ko,
    componentTemplate,
    DateAdjustment
  ) {
    function DateAdjustmentViewModel(params) {
      var self = this;
      self.DateAdjustment = params.DateAdjustment;
      self.getFieldName = function(field) {
        switch (field) {
          case DateAdjustment.START_DATE:
            return ko.i18n('options.startDate', 'start date');
          case DateAdjustment.END_DATE:
            return ko.i18n('options.endDate', 'end date');
        }
      } 
    }
  
    // return compoonent definition
    return {
      viewModel: DateAdjustmentViewModel,
      template: componentTemplate,
    };
  });
  