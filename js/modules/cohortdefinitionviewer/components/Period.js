define(['knockout', 'text!./PeriodTemplate.html'], function (ko, componentTemplate) {

	function PeriodViewModel(params) {
		var self = this;
		self.Period = ko.toJS(params.Period); // this will be a Period input type.
		
		self.startDateExpression = ko.pureComputed(function () {
			if (self.Period.StartDate == null)
				return ("on the period start date");
			return ("on " + self.Period.StartDate);			
		});
		
		self.endDateExpression = ko.pureComputed(function () {
			if (self.Period.EndDate == null)
				return ("on the period end date");
			return ("on " + self.Period.EndDate);			
		});
	};

	// return compoonent definition
	return {
		viewModel: PeriodViewModel,
		template: componentTemplate
	};

});