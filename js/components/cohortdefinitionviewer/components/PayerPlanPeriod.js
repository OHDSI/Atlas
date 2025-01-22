define(['knockout','components/cohortbuilder/options', 'text!./PayerPlanPeriodTemplate.html'
], function (ko, options, template) {
	function PayerPlanPeriodViewModel(params) {
		var self = this;
		
		self.expression = ko.utils.unwrapObservable(params.expression);
		self.Criteria = params.criteria.PayerPlanPeriod;
		self.options = options;
		
    self.indexMessage = ko.i18n('components.conditionPayerPlanPeriod.indexDataText', 'The index date refers to the payer plan period.');
	}
	
	return {
		viewModel: PayerPlanPeriodViewModel,
		template: template
	};
});