define(['knockout', 'text!./EndStrategyViewerTemplate.html', './DateOffsetStrategy', './CustomEraStrategy']
			 , function (ko, template, dateOffsetStrategyComponent, customEraStrategyComponent) {

	ko.components.register('date-offset-strategy-viewer', dateOffsetStrategyComponent);
	ko.components.register('custom-era-strategy-viewer', customEraStrategyComponent);
	
	
	function EndStrategyViewerViewModel(params) {
		var self = this;

		self.strategy = params.strategy;
		self.conceptSets = params.conceptSets;

		self.strategyComponentName = ko.pureComputed(function () {
			var strategy = ko.utils.unwrapObservable(params.strategy)
			if (strategy.hasOwnProperty("DateOffset"))
				return "date-offset-strategy-viewer";
			else if (strategy.hasOwnProperty("CustomEra"))
				return "custom-era-strategy-viewer";
			else
				return "unknown-strategy-viewer";
		});
	}

	// return compoonent definition
	return {
		viewModel: EndStrategyViewerViewModel,
		template: template
	};
});