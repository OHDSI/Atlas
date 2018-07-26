define(['knockout', 'text!./EndStrategyEditorTemplate.html', '../EndStrategies', './DateOffsetStrategy', './CustomEraStrategy'], function (ko, template, strategies, dateOffsetStrategyComponent, customEraStrategyComponent) {

	ko.components.register('date-offset-strategy', dateOffsetStrategyComponent);
	ko.components.register('custom-era-strategy', customEraStrategyComponent);
	
	
	function EndStrategyEditorViewModel(params) {
		var self = this;

		self.strategy = params.strategy;
		self.conceptSets = params.conceptSets;

		self.setStrategy = function(strategyType) {
			switch(strategyType) {
				case 'dateOffset': 
					self.strategy({
						DateOffset: new strategies.DateOffset({}, self.conceptSets)
					});
					break;
				case 'customEra':
					self.strategy({
						CustomEra: new strategies.CustomEra({}, self.conceptSets)
					});
					break;
				default:
					console.log(strategyType + ' strategy not valid.');
			}		
		}
		
		self.clearStrategy = function()
		{
			self.strategy(null);	
		}
		
		self.strategyComponentName = ko.pureComputed(function () {
			var strategy = ko.utils.unwrapObservable(params.strategy)
			if (strategy.hasOwnProperty("DateOffset"))
				return "date-offset-strategy";
			else if (strategy.hasOwnProperty("CustomEra"))
				return "custom-era-strategy";
			else
				return "unknown-strategy";
		});
	}

	// return compoonent definition
	return {
		viewModel: EndStrategyEditorViewModel,
		template: template
	};
});