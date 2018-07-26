define(['knockout', '../options', '../InputTypes/Range', '../CriteriaGroup', 'text!./VisitOccurrenceTemplate.html'], function (ko, options, Range, CriteriaGroup, template) {

	function VisitOccurrenceViewModel(params) {
		var self = this;
		self.formatOption = function (d) {
			return '<div class="optionText">' + d.text + '</div>' +
				'<div class="optionDescription">' + d.description + '</div>';
		};
		self.addActions = [{
				text: "Add First Visit Criteria",
				selected: false,
				description: "Limit Visit Occurrences to the first visit.",
				action: function () {
					if (self.Criteria.First() == null)
						self.Criteria.First(true);
				}
			},
			{
				text: "Add Age at Occurrence Criteria",
				selected: false,
				description: "Filter Visit Occurrences by age at occurrence.",
				action: function () {
					if (self.Criteria.Age() == null)
						self.Criteria.Age(new Range());
				}
			},
			{
				text: "Add Gender Criteria",
				selected: false,
				description: "Filter Visit Occurrences based on Gender.",
				action: function () {
					if (self.Criteria.Gender() == null)
						self.Criteria.Gender(ko.observableArray());
				}
			},
			{
				text: "Add Start Date Criteria",
				selected: false,
				description: "Filter Visit Occurrences by the Condition Start Date.",
				action: function () {
					if (self.Criteria.OccurrenceStartDate() == null)
						self.Criteria.OccurrenceStartDate(new Range({
							Op: "lt"
						}));
				}
			},
			{
				text: "Add End Date Criteria",
				selected: false,
				description: "Filter Visit Occurrences  by the Condition End Date",
				action: function () {
					if (self.Criteria.OccurrenceEndDate() == null)
						self.Criteria.OccurrenceEndDate(new Range({
							Op: "lt"
						}));
				}
			},
			{
				text: "Add Visit Type Criteria",
				selected: false,
				description: "Filter Condition Occurrences  by the Condition Type.",
				action: function () {
					if (self.Criteria.VisitType() == null)
						self.Criteria.VisitType(ko.observableArray());
				}
			},
			{
				text: "Add Visit Length Criteria",
				selected: false,
				description: "Filter Visit Occurrences by duration.",
				action: function () {
					if (self.Criteria.VisitLength() == null)
						self.Criteria.VisitLength(new Range());
				}
			},
			{
				text: "Add Visit Source Concept Criteria",
				selected: false,
				description: "Filter Visit Occurrences by the Visit Source Concept.",
				action: function () {
					if (self.Criteria.VisitSourceConcept() == null)
						self.Criteria.VisitSourceConcept(ko.observable());
				}
			},
			{
				text: "Add Provider Specialty Criteria",
				selected: false,
				description: "Filter Visit Occurrences based on provider specialty.",
				action: function () {
					if (self.Criteria.ProviderSpecialty() == null)
						self.Criteria.ProviderSpecialty(ko.observableArray());
				}
			},
			{
				text: "Add Place of Service Criteria",
				selected: false,
				description: "Filter Visit Occurrences based on Place of Service.",
				action: function () {
					if (self.Criteria.PlaceOfService() == null)
						self.Criteria.PlaceOfService(ko.observableArray());
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
