define(['knockout', '../options', '../InputTypes/Range', 'text!./VisitOccurrenceTemplate.html'], function (ko, options, Range, template) {

	function VisitOccurrenceViewModel(params) {
		var self = this;

		var addActions = [
			{
				text: "Add Visit Start Date Filter",
				selected: false,
				description: "Filter Visit Occurrences by the Condition Start Date.",
				action: function () {
					if (self.Criteria.OccurrenceStartDate() == null)
						self.Criteria.OccurrenceStartDate(new Range({Op: "lt"}));
				}
			},
			{
				text: "Add Visit End Date Filter",
				selected: false,
				description: "Filter Visit Occurrences  by the Condition End Date",
				action: function() {
					if (self.Criteria.OccurrenceEndDate() == null)
						self.Criteria.OccurrenceEndDate(new Range({Op: "lt"}));
				}
			},
			{
				text: "Add Visit Type Filter",
				selected: false,
				description: "Filter Condition Occurrences  by the Condition Type.",
				action: function() {
					if (self.Criteria.VisitType() == null)
						self.Criteria.VisitType(ko.observableArray());
				}
			},
			{
				text: "Add Visit Source Concept Filter",
				selected: false,
				description: "Filter Visit Occurrences by the Visit Source Concept.",
				action: function() {
					if (self.Criteria.VisitSourceConcept() == null)
						self.Criteria.VisitSourceConcept(ko.observable());
				}
			},
			{
				text: "Add Visit Length Filter",
				selected: false,
				description: "Filter Visit Occurrences by duration.",
				action: function() {
					if (self.Criteria.VisitLength() == null)
						self.Criteria.VisitLength(new Range());
				}
			},
			{
				text: "Add Initial Visit Filter",
				selected: false,
				description: "Limit Visit Occurrences to the first visit.",
				action: function() {
					if (self.Criteria.First() == null)
						self.Criteria.First(true);
				}
			},
			{
				text: "Add Age at Occurrence Filter",
				selected: false,
				description: "Filter Visit Occurrences by age at occurrence.",
				action: function() {
					if (self.Criteria.Age() == null)
						self.Criteria.Age(new Range());
				}
			}, 
			{
				text: "Add Gender Filter",
				selected: false,
				description: "Filter Visit Occurrences based on Gender.",
				action: function() {
					if (self.Criteria.Gender() == null)
						self.Criteria.Gender(ko.observableArray());
				}
			},
			{
				text: "Add Provider Specialty Filter",
				selected: false,
				description: "Filter Visit Occurrences based on provider specialty.",
				action: function() {
					if (self.Criteria.ProviderSpecialty() == null)
						self.Criteria.ProviderSpecialty(ko.observableArray());
				}
			},
			{
				text: "Add Place of Service Filter",
				selected: false,
				description: "Filter Visit Occurrences based on Place of Service.",
				action: function() {
					if (self.Criteria.PlaceOfService() == null)
						self.Criteria.PlaceOfService(ko.observableArray());
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

		self.expression = params.expression;
		self.Criteria = params.criteria.VisitOccurrence;
		self.options = options;

		self.removeCriterion = function (propertyName) {
			self.Criteria[propertyName](null);
		}


	}

	// return compoonent definition
	return {
		viewModel: VisitOccurrenceViewModel,
		template: template
	};
});