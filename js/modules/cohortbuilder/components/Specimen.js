define(['knockout', '../options', '../InputTypes/Range', '../InputTypes/Text', 'text!./SpecimenTemplate.html'], function (ko, options, Range, Text, template) {

	function SpecimenViewModel(params) {
		var self = this;
		self.expression = ko.utils.unwrapObservable(params.expression);
		self.Criteria = params.criteria.Specimen;
		self.options = options;
		
		var addActions = [
			{
				text: "Add Specimen Date Filter",
				selected: false,
				description: "Filter Specimen by Date.",
				action: function() { 
					if (self.Criteria.OccurrenceStartDate() == null)
						self.Criteria.OccurrenceStartDate(new Range({Op: "lt"}));
				}
			},
			{
				text: "Add Specimen Type Filter",
				selected: false,
				description: "Filter Specimen by the Type.",
				action: function() {
				 if (self.Criteria.SpecimenType() == null)
					self.Criteria.SpecimenType(ko.observableArray());
				}
			},
			{
				text: "Add Quantity Filter",
				selected: false,
				description: "Filter Observations  by the Quantity.",
				action: function() {
					if (self.Criteria.Quantity() == null)
						self.Criteria.Quantity(new Range({Op: "lt"}));
				}
			},
			{
				text: "Add Unit Filter",
				selected: false,
				description: "Filter Specimens by Unit.",
				action: function() {
					if (self.Criteria.Unit() == null)
						self.Criteria.Unit(ko.observableArray());
				}
			},
			{
				text: "Add Anatomic Site Filter",
				selected: false,
				description: "Filter Specimens by the Anatomic Site.",
				action: function() {
					if (self.Criteria.AnatomicSite() == null)
						self.Criteria.AnatomicSite(ko.observableArray());
				}
			},
			{
				text: "Add Disease Status Filter",
				selected: false,
				description: "Filter Specimens by the Disease Status.",
				action: function() {
					if (self.Criteria.DiseaseStatus() == null)
						self.Criteria.DiseaseStatus(ko.observableArray());
				}
			},
			{
				text: "Add Source ID Filter",
				selected: false,
				description: "Filter Specimens by the Source ID.",
				action: function() {
					if (self.Criteria.SourceId() == null)
						self.Criteria.SourceId(new Text({Op: "contains"}));
				}
			},
			{
				text: "Add First Observation Filter",
				selected: false,
				description: "Limit Specimen to the first occurrence.",
				action: function() {
					if (self.Criteria.First() == null)
						self.Criteria.First(true);					
				}
			},
			{
				text: "Add Age at Occurrence Filter",
				selected: false,
				description: "Filter specimens by age at occurrence.",
				action: function() {
					if (self.Criteria.Age() == null)
						self.Criteria.Age(new Range());					
				}
			}, 
			{
				text: "Add Gender Filter",
				selected: false,
				description: "Filter specimens based on Gender.",
				action: function() {
					if (self.Criteria.Gender() == null)
						self.Criteria.Gender(ko.observableArray());					
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
		viewModel: SpecimenViewModel,
		template: template
	};
});