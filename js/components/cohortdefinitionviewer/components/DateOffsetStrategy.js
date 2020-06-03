define(['knockout', 'text!./DateOffsetStrategyTemplate.html'], function (ko, template) {

	function DateOffsetStrategyViewModel(params) {
		var self = this;

		self.strategy = ko.pureComputed(function () {
			return ko.utils.unwrapObservable(params.strategy).DateOffset;
		});
				
		self.fieldOptions = [{id: 'StartDate', name: ko.i18n('options.startDate', 'start date')}, {id: 'EndDate', name: ko.i18n('options.endDate', 'end date')}]
		
		self.fieldName = ko.pureComputed(function() {
			return self.fieldOptions.filter(function (option) { return option.id == ko.utils.unwrapObservable(self.strategy().DateField); })[0].name;
		});
		
	}

	// return compoonent definition
	return {
		viewModel: DateOffsetStrategyViewModel,
		template: template
	};
});