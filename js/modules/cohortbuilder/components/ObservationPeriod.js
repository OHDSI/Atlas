define(['knockout', '../options', '../InputTypes/Range', 'text!./ObservationPeriodTemplate.html'], function (ko, options, Range, template) {

	function ObservationPeriodViewModel(params) {
		var self = this;

		self.expression = params.expression;
		self.Criteria = params.criteria.ObservationPeriod;
		self.options = options;
		
		var addActions = [
			{
				text: "Period Limit Filter",
				value: 5,
				selected: false,
				description: "Limit Observation Period to first period.",
				action: function() {
					if (self.Criteria.First() == null)
						self.Criteria.First(true);
				}
			},
			{
				text: "Add Period Start Date Filter",
				value: 0,
				selected: false,
				description: "Filter Observation Periods by Start Date.",
				action: function() { 
					if (self.Criteria.PeriodStartDate() == null)
						self.Criteria.PeriodStartDate(new Range({Op: "lt"}));
				}
			},
			{
				text: "Add Period End Date Filter",
				value: 1,
				selected: false,
				description: "Filter Observation Periods by End Date.",
				action: function() { 
					if (self.Criteria.PeriodEndDate() == null)
						self.Criteria.PeriodEndDate(new Range({Op: "lt"}));
				}
			},
			{
				text: "Add Period Type Filter",
				value: 2,
				selected: false,
				description: "Filter Obsevation Periods by Type.",
				action: function() { 
					if (self.Criteria.PeriodType() == null)
						self.Criteria.PeriodType(ko.observableArray());
				}				
			},	
			{
				text: "Add Age at Start Filter",
				value: 3,
				selected: false,
				description: "Filter Periods by Age at Start.",
				action: function() { 
					if (self.Criteria.AgeAtStart() == null)
						self.Criteria.AgeAtStart(new Range());
				}
			}, 
			{
				text: "Add Age at End Filter",
				value: 4,
				selected: false,
				description: "Filter Periods by age at End.",
				action: function() { 
					if (self.Criteria.AgeAtEnd() == null)
						self.Criteria.AgeAtEnd(new Range());
				}
			}, 
			{
				text: "Add Period Length Filter",
				value: 13,
				selected: false,
				description: "Filter Observation Periods by duration.",
				action: function() { 
					if (self.Criteria.PeriodLength() == null)
						self.Criteria.PeriodLength(new Range());
				}
			}
		];

		self.addCriterionSettings = {
			selectText: "Add Filter...",
			height:300,
			actionOptions: addActions,
			onAction: function (data) {
				data.selectedData.action();
			}
		};

		self.removeCriterion = function (propertyName) {
			self.Criteria[propertyName](null);
		}
	}

	// return compoonent definition
	return {
		viewModel: ObservationPeriodViewModel,
		template: template
	};
});