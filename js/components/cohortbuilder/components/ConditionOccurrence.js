define(['knockout', '../options', '../InputTypes/Range', '../InputTypes/Text', '../CriteriaGroup', 'text!./ConditionOccurrenceTemplate.html', './ConceptSetSelector'], function (ko, options, Range, Text, CriteriaGroup, template) {

	function ConditionOccurrenceViewModel(params) {

		var self = this;
		self.expression = ko.utils.unwrapObservable(params.expression);
		self.Criteria = params.criteria.ConditionOccurrence;
		self.options = options;

		self.formatOption = function (d) {
			return '<div class="optionText">' + d.text + '</div>' +
				'<div class="optionDescription">' + d.description + '</div>';
		};

		self.addActions = [{
				text: "Add First Diagnosis Criteria",
				selected: false,
				description: "Limit Condition Occurrences to new diagnosis.",
				action: function () {
					if (self.Criteria.First() == null)
						self.Criteria.First(true);
				}
			},
			{
				text: "Add Age at Occurrence Criteria",
				selected: false,
				description: "Filter Condition Occurrences by age at occurrence.",
				action: function () {
					if (self.Criteria.Age() == null)
						self.Criteria.Age(new Range());
				}
			},
			{
				text: "Add Gender Criteria",
				selected: false,
				description: "Filter Condition Occurrences based on Gender.",
				action: function () {
					if (self.Criteria.Gender() == null)
						self.Criteria.Gender(ko.observableArray());
				}

			},
			{
				text: "Add Condition Start Date Criteria",
				selected: false,
				description: "Filter Condition Occurrences by the Condition Start Date.",
				action: function () {
					if (self.Criteria.OccurrenceStartDate() == null)
						self.Criteria.OccurrenceStartDate(new Range({
							Op: "lt"
						}));
				}
			},
			{
				text: "Add Condition End Date Criteria",
				selected: false,
				description: "Filter Condition Occurrences  by the Condition End Date",
				action: function () {
					if (self.Criteria.OccurrenceEndDate() == null)
						self.Criteria.OccurrenceEndDate(new Range({
							Op: "lt"
						}));
				}
			},
			{
				text: "Add Condition Type Criteria",
				selected: false,
				description: "Filter Condition Occurrences  by the Condition Type.",
				action: function () {
					if (self.Criteria.ConditionType() == null)
						self.Criteria.ConditionType(ko.observableArray());
				}
			},
			{
				text: "Add Visit Criteria",
				selected: false,
				description: "Filter Condition Occurrences based on visit occurrence of diagnosis.",
				action: function () {
					if (self.Criteria.VisitType() == null)
						self.Criteria.VisitType(ko.observableArray());
				}
			},
			{
				text: "Add Stop Reason Criteria",
				selected: false,
				description: "Filter Condition Occurrences  by the Stop Reason.",
				action: function () {
					if (self.Criteria.StopReason() == null)
						self.Criteria.StopReason(new Text({
							Op: "contains"
						}));
				}
			},
			{
				text: "Add Condition Source Concept Criteria",
				selected: false,
				description: "Filter Condition Occurrences  by the Condition Source Concept.",
				action: function () {
					if (self.Criteria.ConditionSourceConcept() == null)
						self.Criteria.ConditionSourceConcept(ko.observable());
				}
			},
			{
				text: "Add Provider Specialty Criteria",
				selected: false,
				description: "Filter Condition Occurrences based on provider specialty.",
				action: function () {
					if (self.Criteria.ProviderSpecialty() == null)
						self.Criteria.ProviderSpecialty(ko.observableArray());
				}
			},
			{
				text: "Add Nested Criteria...",
				selected: false,
				description: "Apply criteria using the condition occurrence as the index date",
				action: function () {
					if (self.Criteria.CorrelatedCriteria() == null)
						self.Criteria.CorrelatedCriteria(new CriteriaGroup(null, self.expression.ConceptSets));
				}
			}
		];

		self.addCriterionSettings = {
			selectText: "Add criteria attribute…",
			height: 300,
			actionOptions: self.addActions,
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
		viewModel: ConditionOccurrenceViewModel,
		template: template
	};
});
