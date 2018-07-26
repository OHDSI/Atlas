define(['knockout', '../options', '../InputTypes/Range', '../InputTypes/Period', '../CriteriaGroup', 'text!./PayerPlanPeriodTemplate.html'], function (ko, options, Range, Period, CriteriaGroup, template) {
	function PayerPlanPeriodViewModel(params) {
		var self = this;

		self.expression = ko.utils.unwrapObservable(params.expression);
		self.Criteria = params.criteria.PayerPlanPeriod;
		self.options = options;

		self.formatOption = function (d) {
			return '<div class="optionText">' + d.text + '</div>' +
				'<div class="optionDescription">' + d.description + '</div>';
		};
		self.addActions = [
			{
				text: "First Payer Plan Period Criteria",
				selected: false,
				description: "Limit Payer Plan Period to first period in history.",
				action: function () {
					if (self.Criteria.First() == null)
						self.Criteria.First(true);
				}
			},
			{
				text: "Add Age at Start Criteria",
				selected: false,
				description: "Filter Periods by Age at Start.",
				action: function () {
					if (self.Criteria.AgeAtStart() == null)
						self.Criteria.AgeAtStart(new Range());
				}
			},
			{
				text: "Add Age at End Criteria",
				selected: false,
				description: "Filter Periods by Age at End.",
				action: function () {
					if (self.Criteria.AgeAtEnd() == null)
						self.Criteria.AgeAtEnd(new Range());
				}
			},
			{
				text: "Add Period Length Criteria",
				selected: false,
				description: "Filter Payer Plan Periods by duration",
				action: function () {
					if (self.Criteria.PeriodLength() == null)
						self.Criteria.PeriodLength(new Range());
				}
			},
			{
				text: "Add Gender Criteria",
				selected: false,
				description: "Filter Payer Plan Periods based on Gender.",
				action: function () {
					if (self.Criteria.Gender() == null)
						self.Criteria.Gender(ko.observableArray());
				}
			},
			{
				text: "Specify Start and End Dates",
				selected: false,
				description: "Specify start and end dates to use for Payer Plan Period.",
				action: function () {
					if (self.Criteria.UserDefinedPeriod() == null)
						self.Criteria.UserDefinedPeriod(new Period());
				}
						},
			{
				text: "Add Period Start Date Criteria",
				selected: false,
				description: "Filter Payer Plan Periods by Start Date.",
				action: function () {
					if (self.Criteria.PeriodStartDate() == null)
						self.Criteria.PeriodStartDate(new Range({
							Op: "lt"
						}));
				}
						},
			{
				text: "Add Period End Date Criteria",
				selected: false,
				description: "Filter Payer Plan Periods by End Date.",
				action: function () {
					if (self.Criteria.PeriodEndDate() == null)
						self.Criteria.PeriodEndDate(new Range({
							Op: "lt"
						}));
				}
			},
			{
				text: "Add Payer Concept Criteria",
				selected: false,
				description: "Filter Payer Plan Periods by Payer Concept.",
				action: function () {
					if (self.Criteria.PayerConcept() == null)
						self.Criteria.PayerConcept(ko.observable());
				}
						},
			{
				text: "Add Plan Concept Criteria",
				selected: false,
				description: "Filter Payer Plan Periods by Plan Concept.",
				action: function () {
					if (self.Criteria.PlanConcept() == null)
						self.Criteria.PlanConcept(ko.observable());
				}
			},
			{
				text: "Add Sponsor Concept Criteria",
				selected: false,
				description: "Filter Payer Plan Periods by Sponsor Concept.",
				action: function () {
					if (self.Criteria.SponsorConcept() == null)
						self.Criteria.SponsorConcept(ko.observable());
				}
			},
			{
				text: "Add Stop Reason Concept Criteria",
				selected: false,
				description: "Filter Payer Plan Periods by Stop Reason Concept.",
				action: function () {
					if (self.Criteria.StopReasonConcept() == null)
						self.Criteria.StopReasonConcept(ko.observable());
				}
			},
			{
				text: "Add Payer Source Concept Criteria",
				selected: false,
				description: "Filter Payer Plan Periods by Payer Source Concept.",
				action: function () {
					if (self.Criteria.PayerSourceConcept() == null)
						self.Criteria.PayerSourceConcept(ko.observable());
				}
			},
			{
				text: "Add Plan Source Concept Criteria",
				selected: false,
				description: "Filter Payer Plan Periods by Plan Source Concept.",
				action: function () {
					if (self.Criteria.PlanSourceConcept() == null)
						self.Criteria.PlanSourceConcept(ko.observable());
				}
						},
			{
				text: "Add Sponsor Source Concept Criteria",
				selected: false,
				description: "Filter Payer Plan Periods by Sponsor Source Concept.",
				action: function () {
					if (self.Criteria.SponsorSourceConcept() == null)
						self.Criteria.SponsorSourceConcept(ko.observable());
				}
			},
			{
				text: "Add Stop Reason Source Concept Criteria",
				selected: false,
				description: "Filter Payer Plan Periods by Stop Reason Source Concept.",
				action: function () {
					if (self.Criteria.StopReasonSourceConcept() == null)
						self.Criteria.StopReasonSourceConcept(ko.observable());
				}
			},
			{
				text: "Add Nested Criteria...",
				selected: false,
				description: "Apply criteria using the condition occurrence as the index date.",
				action: function () {
					if (self.Criteria.CorrelatedCriteria() == null)
						self.Criteria.CorrelatedCriteria(new CriteriaGroup(null, self.expression.ConceptSets));
				}
			}
		];

		self.removeCriterion = function (propertyName) {
			self.Criteria[propertyName](null);
		}
	}

	return {
		viewModel: PayerPlanPeriodViewModel,
		template: template
	};
});