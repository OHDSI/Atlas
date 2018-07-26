define(['knockout', '../options', '../InputTypes/Range', '../InputTypes/Text', '../CriteriaGroup', 'text!./ObservationTemplate.html'], function (ko, options, Range, Text, CriteriaGroup, template) {

	function ObservationViewModel(params) {
		var self = this;
		self.formatOption = function (d) {
			return '<div class="optionText">' + d.text + '</div>' +
				'<div class="optionDescription">' + d.description + '</div>';
		};
		self.addActions = [{
				text: "Add First Observation Criteria",
				selected: false,
				description: "Limit Observations to the first occurrence.",
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
				description: "Filter Observations based on Gender.",
				action: function () {
					if (self.Criteria.Gender() == null)
						self.Criteria.Gender(ko.observableArray());
				}
			},
			{
				text: "Add Observation Date Criteria",
				selected: false,
				description: "Filter Observations by Date.",
				action: function () {
					if (self.Criteria.OccurrenceStartDate() == null)
						self.Criteria.OccurrenceStartDate(new Range({
							Op: "lt"
						}));
				}
			},
			{
				text: "Add Observation Type Criteria",
				selected: false,
				description: "Filter Observations by the Type.",
				action: function () {
					if (self.Criteria.ObservationType() == null)
						self.Criteria.ObservationType(ko.observableArray());
				}
			},
			{
				text: "Add Visit Criteria",
				selected: false,
				description: "Filter Observations based on visit occurrence of observation.",
				action: function () {
					if (self.Criteria.VisitType() == null)
						self.Criteria.VisitType(ko.observableArray());
				}
			},
			{
				text: "Add Value As Number Criteria",
				selected: false,
				description: "Filter Observations  by the Value As Number.",
				action: function () {
					if (self.Criteria.ValueAsNumber() == null)
						self.Criteria.ValueAsNumber(new Range({
							Op: "lt"
						}));
				}
			},
			{
				text: "Add Value As String Criteria",
				selected: false,
				description: "Filter Observations by the Value As String.",
				action: function () {
					if (self.Criteria.ValueAsString() == null)
						self.Criteria.ValueAsString(new Text({
							Op: "contains"
						}));
				}
			},
			{
				text: "Add Value as Concept Criteria",
				selected: false,
				description: "Filter Observations by the Value As Concept.",
				action: function () {
					if (self.Criteria.ValueAsConcept() == null)
						self.Criteria.ValueAsConcept(ko.observableArray());
				}
			},
			{
				text: "Add Qualifier Criteria",
				selected: false,
				description: "Filter Observations by Qualifier.",
				action: function () {
					if (self.Criteria.Qualifier() == null)
						self.Criteria.Qualifier(ko.observableArray());
				}
			},
			{
				text: "Add Unit Criteria",
				selected: false,
				description: "Filter Observations by Unit.",
				action: function () {
					if (self.Criteria.Unit() == null)
						self.Criteria.Unit(ko.observableArray());
				}
			},
			{
				text: "Add Observation Source Concept Criteria",
				selected: false,
				description: "Filter Observations by the Source Concept.",
				action: function () {
					if (self.Criteria.ObservationSourceConcept() == null)
						self.Criteria.ObservationSourceConcept(ko.observable());
				}
			},
			/*
			 			{
							text: "Add Prior Observation Duration Criteria",
							value: 8,
							selected: false,
							description: "Filter Condition Occurrences based on Prior Observation Duration."
								},
						{
							text: "Add Post Observation Duration Criteria",
							value: 9,
							selected: false,
							description: "Filter Condition Occurrences based on Prior Observation Duration."
								},
			*/
			{
				text: "Add Provider Specialty Criteria",
				selected: false,
				description: "Filter Observations based on provider specialty.",
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

		self.expression = ko.utils.unwrapObservable(params.expression);
		self.Criteria = params.criteria.Observation;
		self.options = options;

		self.removeCriterion = function (propertyName) {
			self.Criteria[propertyName](null);
		}
	}

	// return compoonent definition
	return {
		viewModel: ObservationViewModel,
		template: template
	};
});
