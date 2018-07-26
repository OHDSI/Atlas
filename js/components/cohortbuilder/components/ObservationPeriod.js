define(['knockout', '../options', '../InputTypes/Range', '../InputTypes/Period', '../CriteriaGroup', 'text!./ObservationPeriodTemplate.html'], function (ko, options, Range, Period, CriteriaGroup, template) {

	function ObservationPeriodViewModel(params) {
		var self = this;

		self.expression = ko.utils.unwrapObservable(params.expression);
		self.Criteria = params.criteria.ObservationPeriod;
		self.options = options;

		self.formatOption = function (d) {
			return '<div class="optionText">' + d.text + '</div>' +
				'<div class="optionDescription">' + d.description + '</div>';
		};

		self.addActions = [{
				text: "First Observation Period Criteria",
				value: 5,
				selected: false,
				description: "Limit Observation Period to first period in history.",
				action: function () {
					if (self.Criteria.First() == null)
						self.Criteria.First(true);
				}
			},
			{
				text: "Add Age at Start Criteria",
				value: 3,
				selected: false,
				description: "Filter Periods by Age at Start.",
				action: function () {
					if (self.Criteria.AgeAtStart() == null)
						self.Criteria.AgeAtStart(new Range());
				}
			},
			{
				text: "Specify Start and End Dates",
				value: 6,
				selected: false,
				description: "Specify start and end date to use for the Observation Period.",
				action: function () {
					if (self.Criteria.UserDefinedPeriod() == null)
						self.Criteria.UserDefinedPeriod(new Period());
				}
			},
			{
				text: "Add Age at End Criteria",
				value: 4,
				selected: false,
				description: "Filter Periods by age at End.",
				action: function () {
					if (self.Criteria.AgeAtEnd() == null)
						self.Criteria.AgeAtEnd(new Range());
				}
			},
			{
				text: "Add Period Start Date Criteria",
				value: 0,
				selected: false,
				description: "Filter Observation Periods by Start Date.",
				action: function () {
					if (self.Criteria.PeriodStartDate() == null)
						self.Criteria.PeriodStartDate(new Range({
							Op: "lt"
						}));
				}
			},
			{
				text: "Add Period End Date Criteria",
				value: 1,
				selected: false,
				description: "Filter Observation Periods by End Date.",
				action: function () {
					if (self.Criteria.PeriodEndDate() == null)
						self.Criteria.PeriodEndDate(new Range({
							Op: "lt"
						}));
				}
			},
			{
				text: "Add Period Type Criteria",
				value: 2,
				selected: false,
				description: "Filter Obsevation Periods by Type.",
				action: function () {
					if (self.Criteria.PeriodType() == null)
						self.Criteria.PeriodType(ko.observableArray());
				}
			},
			{
				text: "Add Period Length Criteria",
				value: 13,
				selected: false,
				description: "Filter Observation Periods by duration.",
				action: function () {
					if (self.Criteria.PeriodLength() == null)
						self.Criteria.PeriodLength(new Range());
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
		viewModel: ObservationPeriodViewModel,
		template: template
	};
});
