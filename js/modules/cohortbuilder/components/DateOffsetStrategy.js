define(['knockout', 'text!./DateOffsetStrategyTemplate.html', '../options'], function (ko, template, options) {

	function DateOffsetStrategyViewModel(params) {
		var self = this;
		self.options = options;

		self.strategy = ko.pureComputed(function () {
			return ko.utils.unwrapObservable(params.strategy).DateOffset;
		});
		
		self.fieldOptions = [{id: 'StartDate', name: 'start date'}, {id: 'EndDate', name: 'end date'}]
	}

	// return compoonent definition
	return {
		viewModel: DateOffsetStrategyViewModel,
		template: template
	};
});