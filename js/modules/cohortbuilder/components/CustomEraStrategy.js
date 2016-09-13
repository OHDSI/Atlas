define(['knockout', 'text!./CustomEraStrategyTemplate.html', '../options'], function (ko, template, options) {

	function CustomEraStrategyViewModel(params) {
		var self = this;
		self.options = options;

		self.strategy = ko.pureComputed(function () {
			return ko.utils.unwrapObservable(params.strategy).CustomEra;
		});
		
		self.conceptSets = params.conceptSets
	}

	// return compoonent definition
	return {
		viewModel: CustomEraStrategyViewModel,
		template: template
	};
});