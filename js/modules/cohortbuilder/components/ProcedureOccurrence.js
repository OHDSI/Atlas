define(['knockout', '../options', '../InputTypes/Range', '../InputTypes/Text', 'text!./ProcedureOccurrenceTemplate.html'], function (ko, options, Range, Text, template) {

	function ProcedureOccurrenceViewModel(params) {
		var self = this;

		var addActions = [
			{
				text: "Add Procedure Start Date Filter",
				value: 0,
				selected: false,
				description: "Filter Procedure Occurrences by the Procedure Start Date."
			},
			{
				text: "Add Procedure Type Filter",
				value: 2,
				selected: false,
				description: "Filter Procedure Occurrences  by the Procedure Type."
			},
			{
				text: "Add Modifier Filter",
				value: 1,
				selected: false,
				description: "Filter Procedure Occurrences  by the Modifier."
			},
			{
				text: "Add Quantity Filter",
				value: 3,
				selected: false,
				description: "Filter Procedure Occurrences  by Quantity."
					},
			{
				text: "Add Procedure Source Concept Filter",
				value: 4,
				selected: false,
				description: "Filter Procedure Occurrences  by the Procedure Source Concept."
					},
			{
				text: "Add New Diagnosis Filter",
				value: 5,
				selected: false,
				description: "Limit Procedure Occurrences to new diagnosis."
					},

			{
				text: "Add Age at Occurrence Filter",
				value: 6,
				selected: false,
				description: "Filter Procedure Occurrences by age at occurrence."
					}, {
				text: "Add Gender Filter",
				value: 7,
				selected: false,
				description: "Filter Procedure Occurrences based on Gender."
					},
/*
 			{
				text: "Add Prior Observation Duration Filter",
				value: 8,
				selected: false,
				description: "Filter Procedure Occurrences based on Prior Observation Duration."
					},
			{
				text: "Add Post Observation Duration Filter",
				value: 9,
				selected: false,
				description: "Filter Procedure Occurrences based on Prior Observation Duration."
					},
*/
			{
				text: "Add Provider Specialty Filter",
				value: 10,
				selected: false,
				description: "Filter Procedure Occurrences based on provider specialty."
					},
			{
				text: "Add Visit Filter",
				value: 11,
				selected: false,
				description: "Filter Procedure Occurrences based on visit occurrence of procedure."
			}
		];

		self.addCriterionSettings = {
			selectText: "Add Filter...",
			height:300,
			actionOptions: addActions,
			onAction: function (data) {
				var criteriaType = data.selectedData.value;
				switch (criteriaType) {
				case 0:
					if (self.Criteria.OccurrenceStartDate() == null)
						self.Criteria.OccurrenceStartDate(new Range({Op: "lt"}));
					break;
				case 1:
					if (self.Criteria.Modifier() == null)
						self.Criteria.Modifier(ko.observableArray());
					break;
				case 2:
					if (self.Criteria.ProcedureType() == null)
						self.Criteria.ProcedureType(ko.observableArray());
					break;
				case 3:
					if (self.Criteria.Quantity() == null)
						self.Criteria.Quantity(new Range({Op: "lt"}));
					break;
				case 4:
					if (self.Criteria.ProcedureSourceConcept() == null)
						self.Criteria.ProcedureSourceConcept(ko.observable());
					break;
				case 5:
					if (self.Criteria.First() == null)
						self.Criteria.First(true);
					break;
				case 6:
					if (self.Criteria.Age() == null)
						self.Criteria.Age(new Range());
					break;
				case 7:
					if (self.Criteria.Gender() == null)
						self.Criteria.Gender(ko.observableArray());
					break;
/*
 				case 8:
					if (typeof self.Criteria.PriorEnrollDays() != "number")
						self.Criteria.PriorEnrollDays(0);
					break;
				case 9:
					if (typeof self.Criteria.AfterEnrollDays() != "number")
						self.Criteria.AfterEnrollDays(0);
					break;
*/
				case 10:
					if (self.Criteria.ProviderSpecialty() == null)
						self.Criteria.ProviderSpecialty(ko.observableArray());
					break;
				case 11:
					if (self.Criteria.VisitType() == null)
						self.Criteria.VisitType(ko.observableArray());
					break;
				}
			}
		};

		self.expression = params.expression;
		self.Criteria = params.criteria.ProcedureOccurrence;
		self.options = options;

		self.removeCriterion = function (propertyName) {
			self.Criteria[propertyName](null);
		}


	}

	// return compoonent definition
	return {
		viewModel: ProcedureOccurrenceViewModel,
		template: template
	};
});