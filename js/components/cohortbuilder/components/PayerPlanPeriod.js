define(['knockout', '../options', '../InputTypes/Range', '../InputTypes/Period', '../CriteriaGroup', 'text!./PayerPlanPeriodTemplate.html'], function (ko, options, Range, Period, CriteriaGroup, template) {
    function PayerPlanPeriodViewModel(params) {
        var self = this;

        self.expression = ko.utils.unwrapObservable(params.expression);
        self.Criteria = params.criteria.PayerPlanPeriod;
        self.options = options;

        self.addActions = [
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.payer-plan-period.criteria.first.option.text', "First Payer Plan Period Criteria"),
                selected: false,
                description: ko.i18n('cc.viewEdit.design.subgroups.add.payer-plan-period.criteria.first.option.description', "Limit Payer Plan Period to first period in history."),
                action: function () {
                    if (self.Criteria.First() == null)
                        self.Criteria.First(true);
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.payer-plan-period.criteria.age-at-start.option.text', "Add Age at Start Criteria"),
                selected: false,
                description: ko.i18n('cc.viewEdit.design.subgroups.add.payer-plan-period.criteria.age-at-start.option.description', "Filter Periods by Age at Start."),
                action: function () {
                    if (self.Criteria.AgeAtStart() == null)
                        self.Criteria.AgeAtStart(new Range());
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.payer-plan-period.criteria.age-at-end.option.text', "Add Age at End Criteria"),
                selected: false,
                description: ko.i18n('cc.viewEdit.design.subgroups.add.payer-plan-period.criteria.age-at-end.option.description', "Filter Periods by Age at End."),
                action: function () {
                    if (self.Criteria.AgeAtEnd() == null)
                        self.Criteria.AgeAtEnd(new Range());
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.payer-plan-period.criteria.ageperiod-length.option.text', "Add Period Length Criteria"),
                selected: false,
                description: ko.i18n('cc.viewEdit.design.subgroups.add.payer-plan-period.criteria.ageperiod-length.option.description', "Filter Payer Plan Periods by duration"),
                action: function () {
                    if (self.Criteria.PeriodLength() == null)
                        self.Criteria.PeriodLength(new Range());
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.payer-plan-period.criteria.gender.option.text', "Add Gender Criteria"),
                selected: false,
                description: ko.i18n('cc.viewEdit.design.subgroups.add.payer-plan-period.criteria.gender.option.description', "Filter Payer Plan Periods based on Gender."),
                action: function () {
                    if (self.Criteria.Gender() == null)
                        self.Criteria.Gender(ko.observableArray());
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.payer-plan-period.criteria.user-defined-period.option.text', "Specify Start and End Dates"),
                selected: false,
                description: ko.i18n('cc.viewEdit.design.subgroups.add.payer-plan-period.criteria.user-defined-period.option.description', "Specify start and end dates to use for Payer Plan Period."),
                action: function () {
                    if (self.Criteria.UserDefinedPeriod() == null)
                        self.Criteria.UserDefinedPeriod(new Period());
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.payer-plan-period.criteria.period-start-date.option.text', "Add Period Start Date Criteria"),
                selected: false,
                description: ko.i18n('cc.viewEdit.design.subgroups.add.payer-plan-period.criteria.period-start-date.option.description', "Filter Payer Plan Periods by Start Date."),
                action: function () {
                    if (self.Criteria.PeriodStartDate() == null)
                        self.Criteria.PeriodStartDate(new Range({
                            Op: "lt"
                        }));
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.payer-plan-period.criteria.period-end-date.option.text', "Add Period End Date Criteria"),
                selected: false,
                description: ko.i18n('cc.viewEdit.design.subgroups.add.payer-plan-period.criteria.period-end-date.option.description', "Filter Payer Plan Periods by End Date."),
                action: function () {
                    if (self.Criteria.PeriodEndDate() == null)
                        self.Criteria.PeriodEndDate(new Range({
                            Op: "lt"
                        }));
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.payer-plan-period.criteria.payer-concept.option.text', "Add Payer Concept Criteria"),
                selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.payer-plan-period.criteria.payer-concept.option.description', "Filter Payer Plan Periods by Payer Concept."),
                action: function () {
                    if (self.Criteria.PayerConcept() == null)
                        self.Criteria.PayerConcept(ko.observable());
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.payer-plan-period.criteria.plan-concept.option.text', "Add Plan Concept Criteria"),
                selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.payer-plan-period.criteria.plan-concept.option.text', "Filter Payer Plan Periods by Plan Concept."),
                action: function () {
                    if (self.Criteria.PlanConcept() == null)
                        self.Criteria.PlanConcept(ko.observable());
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.payer-plan-period.criteria.sponsor-concept.option.text', "Add Sponsor Concept Criteria"),
                selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.payer-plan-period.criteria.sponsor-concept.option.description', "Filter Payer Plan Periods by Sponsor Concept."),
                action: function () {
                    if (self.Criteria.SponsorConcept() == null)
                        self.Criteria.SponsorConcept(ko.observable());
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.payer-plan-period.criteria.stop-reason-concept.option.text', "Add Stop Reason Concept Criteria"),
                selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.payer-plan-period.criteria.stop-reason-concept.option.description', "Filter Payer Plan Periods by Stop Reason Concept."),
                action: function () {
                    if (self.Criteria.StopReasonConcept() == null)
                        self.Criteria.StopReasonConcept(ko.observable());
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.payer-plan-period.criteria.payer-source-concept.option.text', "Add Payer Source Concept Criteria"),
                selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.payer-plan-period.criteria.payer-source-concept.option.description', "Filter Payer Plan Periods by Payer Source Concept."),
                action: function () {
                    if (self.Criteria.PayerSourceConcept() == null)
                        self.Criteria.PayerSourceConcept(ko.observable());
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.payer-plan-period.criteria.pla-source-concept.option.text', "Add Plan Source Concept Criteria"),
                selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.payer-plan-period.criteria.pla-source-concept.option.description', "Filter Payer Plan Periods by Plan Source Concept."),
                action: function () {
                    if (self.Criteria.PlanSourceConcept() == null)
                        self.Criteria.PlanSourceConcept(ko.observable());
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.payer-plan-period.criteria.sponsor-source-concept.option.text', "Add Sponsor Source Concept Criteria"),
                selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.payer-plan-period.criteria.sponsor-source-concept.option.description', "Filter Payer Plan Periods by Sponsor Source Concept."),
                action: function () {
                    if (self.Criteria.SponsorSourceConcept() == null)
                        self.Criteria.SponsorSourceConcept(ko.observable());
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.payer-plan-period.criteria.stop-reason-source-concept.option.text', "Add Stop Reason Source Concept Criteria"),
				description: ko.i18n('cc.viewEdit.design.subgroups.add.payer-plan-period.criteria.stop-reason-source-concept.option.description', "Filter Payer Plan Periods by Stop Reason Source Concept."),
                selected: false,
                action: function () {
                    if (self.Criteria.StopReasonSourceConcept() == null)
                        self.Criteria.StopReasonSourceConcept(ko.observable());
                }
            },
            {
                text: ko.i18n('cc.viewEdit.design.subgroups.add.payer-plan-period.criteria.correlated-criteria.option.text', "Add Nested Criteria..."),
                selected: false,
				description: ko.i18n('cc.viewEdit.design.subgroups.add.payer-plan-period.criteria.correlated-criteria.option.description', "Apply criteria using the payer plan period as the index event."),
                action: function () {
                    if (self.Criteria.CorrelatedCriteria() == null)
                        self.Criteria.CorrelatedCriteria(new CriteriaGroup(null, self.expression.ConceptSets));
                }
            }
        ];

        self.removeCriterion = function (propertyName) {
            self.Criteria[propertyName](null);
        }

        self.indexMessage = ko.i18n('cc.viewEdit.design.subgroups.add.payer-plan-period.criteria.default-concept-name', "The index date refers to the payer plan period.");

    }

    return {
        viewModel: PayerPlanPeriodViewModel,
        template: template
    };
});