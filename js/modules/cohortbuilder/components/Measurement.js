define(['knockout', '../options', '../InputTypes/Range', '../InputTypes/Text', '../CriteriaGroup', 'text!./MeasurementTemplate.html'], function (ko, options, Range, Text, CriteriaGroup, template) {

	function MeasurementViewModel(params) {
		var self = this;

		self.expression = ko.utils.unwrapObservable(params.expression);
		self.Criteria = params.criteria.Measurement;
		self.options = options;

		self.formatOption = function (d) {
			return '<div class="optionText">' + d.text + '</div>' +
				'<div class="optionDescription">' + d.description + '</div>';
		};
		self.addActions = [{
				text: "Add First Measure Criteria",
				value: 14,
				selected: false,
				description: "Limit Measures to first occurrence in history.",
				action: function () {
					if (self.Criteria.First() == null)
						self.Criteria.First(true);
				}
			},
			{
				text: "Add Age at Occurrence Criteria",
				value: 12,
				selected: false,
				description: "Filter Measurements by age at occurrence.",
				action: function () {
					if (self.Criteria.Age() == null)
						self.Criteria.Age(new Range());
				}
			},
			{
				text: "Add Gender Criteria",
				value: 13,
				selected: false,
				description: "Filter Measurements based on Gender.",
				action: function () {
					if (self.Criteria.Gender() == null)
						self.Criteria.Gender(ko.observableArray());
				}
			},
			{
				text: "Add Measurement Date Criteria",
				value: 0,
				selected: false,
				description: "Filter Measurements by Date.",
				action: function () {
					if (self.Criteria.OccurrenceStartDate() == null)
						self.Criteria.OccurrenceStartDate(new Range({
							Op: "lt"
						}));
				}
			},
			{
				text: "Add Measurement Type Criteria",
				value: 1,
				selected: false,
				description: "Filter Measurements by the Measurement Type.",
				action: function () {
					if (self.Criteria.MeasurementType() == null)
						self.Criteria.MeasurementType(ko.observableArray());
				}
			},
			{
				text: "Add Visit Criteria",
				value: 15,
				selected: false,
				description: "Filter Measurements based on visit occurrence of measurement.",
				action: function () {
					if (self.Criteria.VisitType() == null)
						self.Criteria.VisitType(ko.observableArray());
				}
			},
			{
				text: "Add Operator Criteria",
				value: 2,
				selected: false,
				description: "Filter Measurements by Operator.",
				action: function () {
					if (self.Criteria.Operator() == null)
						self.Criteria.Operator(ko.observableArray());
				}
			},
			{
				text: "Add Value as Number Criteria",
				value: 3,
				selected: false,
				description: "Filter Measurements by Value as Number.",
				action: function () {
					if (self.Criteria.ValueAsNumber() == null)
						self.Criteria.ValueAsNumber(new Range());
				}
			},
			{
				text: "Add Value as Concept Criteria",
				value: 4,
				selected: false,
				description: "Filter Measurements by Value as Concept.",
				action: function () {
					if (self.Criteria.ValueAsConcept() == null)
						self.Criteria.ValueAsConcept(ko.observableArray());
				}
			},
			{
				text: "Add Unit Criteria",
				value: 5,
				selected: false,
				description: "Filter Measurements by the Unit.",
				action: function () {
					if (self.Criteria.Unit() == null)
						self.Criteria.Unit(ko.observableArray());
				}
			},
			{
				text: "Add Abnormal Result Criteria",
				value: 11,
				selected: false,
				description: "Filter Measurements to include those which fall outside of normal range.",
				action: function () {
					if (self.Criteria.Abnormal() == null)
						self.Criteria.Abnormal(true);
				}
			},
			{
				text: "Add Low Range Criteria",
				value: 6,
				selected: false,
				description: "Filter Measurements Low Range.",
				action: function () {
					if (self.Criteria.RangeLow() == null)
						self.Criteria.RangeLow(new Range());
				}
			},
			{
				text: "Add High Range Criteria",
				value: 7,
				selected: false,
				description: "Filter Measurements by the Measurement Type.",
				action: function () {
					if (self.Criteria.RangeHigh() == null)
						self.Criteria.RangeHigh(new Range());
				}
			},
			{
				text: "Add Low Range Ratio Criteria",
				value: 9,
				selected: false,
				description: "Filter Measurements by the Ratio of Value as Number to Range Low.",
				action: function () {
					if (self.Criteria.RangeLowRatio() == null)
						self.Criteria.RangeLowRatio(new Range());
				}
			},
			{
				text: "Add High Range Ratio Criteria",
				value: 10,
				selected: false,
				description: "Filter Measurements by the Ratio of Value as Number to Range High.",
				action: function () {
					if (self.Criteria.RangeHighRatio() == null)
						self.Criteria.RangeHighRatio(new Range());
				}
			},
			{
				text: "Add Provider Specialty Criteria",
				value: 14,
				selected: false,
				description: "Filter Measurements based on provider specialty.",
				action: function () {
					if (self.Criteria.ProviderSpecialty() == null)
						self.Criteria.ProviderSpecialty(ko.observableArray());
				}
			},
			{
				text: "Add Measurement Source Concept Criteria",
				value: 8,
				selected: false,
				description: "Filter Measurements by the Measurement Source Concept.",
				action: function () {
					if (self.Criteria.MeasurementSourceConcept() == null)
						self.Criteria.MeasurementSourceConcept(ko.observable());
				}
			},
			{
				text: "Add Nested Criteria...",
				value: 19,
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
		viewModel: MeasurementViewModel,
		template: template
	};
});
