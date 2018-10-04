define(['knockout', 'text!./EndStrategyEditorTemplate.html', '../EndStrategies', './DateOffsetStrategy', './CustomEraStrategy'], function (ko, template, strategies, dateOffsetStrategyComponent, customEraStrategyComponent) {

	ko.components.register('date-offset-strategy', dateOffsetStrategyComponent);
	ko.components.register('custom-era-strategy', customEraStrategyComponent);
	
	function getTypeFromStrategy(strategy) {
		if (strategy == null)
			return "default";
		else if (strategy.hasOwnProperty("DateOffset"))
			return "dateOffset";
		else if (strategy.hasOwnProperty("CustomEra"))
			return "customEra";
		throw new Error("Strategy instance does not resolve to a StrategyType.");
	}
	
	function EndStrategyEditorViewModel(params) {
		var self = this;

		self.strategyOptions = [
			{ name: "default", text: "end of continuous observation"},
			{ name: "dateOffset", text: "fixed duration relative to initial event"},
			{ name: "customEra", text: "end of a continuous drug exposure"}
		]
		
		self.strategy = params.strategy;
		self.conceptSets = params.conceptSets;
		self.strategyType = ko.observable(getTypeFromStrategy(self.strategy()));

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
				case 'default':
					self.clearStrategy();
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
		
		self.subscriptions = [];
		
		// subscriptions
		
		self.subscriptions.push(self.strategyType.subscribe(newVal => {
			self.clearStrategy();
			self.setStrategy(newVal);
		}));
		
		// cleanup
		self.dispose = function () {
			self.subscriptions.forEach(function (subscription) {
				subscription.dispose();
			});
		};		
	}

	// return compoonent definition
	return {
		viewModel: EndStrategyEditorViewModel,
		template: template
	};
});