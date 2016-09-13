define(['knockout', 'text!./CustomEraStrategyTemplate.html'], function (ko, template) {

	function CustomEraStrategyViewModel(params) {
		var self = this;

		self.strategy = ko.pureComputed(function () {
			return ko.utils.unwrapObservable(params.strategy).CustomEra;
		});
		
		self.conceptSets = params.conceptSets;
	}

	// return compoonent definition
	return {
		viewModel: CustomEraStrategyViewModel,
		template: template
	};
});