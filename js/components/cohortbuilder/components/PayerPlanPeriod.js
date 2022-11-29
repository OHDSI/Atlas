define([
  "knockout",
  "../options",
  "../InputTypes/Range",
  "../InputTypes/DateAdjustment",
  "../InputTypes/Period",
  "../CriteriaGroup",
  "text!./PayerPlanPeriodTemplate.html",
  "../const"
], function (ko, options, Range, DateAdjustment, Period, CriteriaGroup, template, constants) {
  function PayerPlanPeriodViewModel(params) {
    var self = this;

    self.expression = ko.utils.unwrapObservable(params.expression);
    self.Criteria = params.criteria.PayerPlanPeriod;
    self.options = options;

    self.addActions = [
      {
        ...constants.payerPlanAttributes.addFirstDiagnosis,
        selected: false,
        action: function () {
          if (self.Criteria.First() == null) self.Criteria.First(true);
        },
      },
      {
        ...constants.payerPlanAttributes.addAgeAtStart,
        selected: false,
        action: function () {
          if (self.Criteria.AgeAtStart() == null)
            self.Criteria.AgeAtStart(new Range());
        },
      },
      {
        ...constants.payerPlanAttributes.addAgeAtEnd,
        selected: false,
        action: function () {
          if (self.Criteria.AgeAtEnd() == null)
            self.Criteria.AgeAtEnd(new Range());
        },
      },
      {
        ...constants.payerPlanAttributes.addUserDefined,
        selected: false,
        action: function () {
          if (self.Criteria.UserDefinedPeriod() == null)
            self.Criteria.UserDefinedPeriod(new Period());
        },
      },
      {
        ...constants.payerPlanAttributes.addStartDate,
        selected: false,
        action: function () {
          if (self.Criteria.PeriodStartDate() == null)
            self.Criteria.PeriodStartDate(
              new Range({
                Op: "lt",
              })
            );
        },
      },
      {
        ...constants.payerPlanAttributes.addEndDate,
        selected: false,
        action: function () {
          if (self.Criteria.PeriodEndDate() == null)
            self.Criteria.PeriodEndDate(
              new Range({
                Op: "lt",
              })
            );
        },
      },
      {
        ...constants.payerPlanAttributes.addDateAdjustment,
        selected: false,
        action: function () {
          if (self.Criteria.DateAdjustment() == null) self.Criteria.DateAdjustment(new DateAdjustment());
        },
      },
      {
        ...constants.payerPlanAttributes.addLength,
        selected: false,
        action: function () {
          if (self.Criteria.PeriodLength() == null)
            self.Criteria.PeriodLength(new Range());
        },
      },
      {
        ...constants.payerPlanAttributes.addGender,
        selected: false,
        action: function () {
          if (self.Criteria.Gender() == null)
            self.Criteria.Gender(ko.observableArray());
        },
      },
      {
        ...constants.payerPlanAttributes.addPayerConcept,
        selected: false,
        action: function () {
          if (self.Criteria.PayerConcept() == null)
            self.Criteria.PayerConcept(ko.observable());
        },
      },
      {
        ...constants.payerPlanAttributes.addPlanConcept,
        selected: false,
        action: function () {
          if (self.Criteria.PlanConcept() == null)
            self.Criteria.PlanConcept(ko.observable());
        },
      },
      {
        ...constants.payerPlanAttributes.addSponsorConcept,
        selected: false,
        action: function () {
          if (self.Criteria.SponsorConcept() == null)
            self.Criteria.SponsorConcept(ko.observable());
        },
      },
      {
        ...constants.payerPlanAttributes.addStopReasonConcept,
        selected: false,
        action: function () {
          if (self.Criteria.StopReasonConcept() == null)
            self.Criteria.StopReasonConcept(ko.observable());
        },
      },
      {
        ...constants.payerPlanAttributes.addPayerSourceConcept,
        selected: false,
        action: function () {
          if (self.Criteria.PayerSourceConcept() == null)
            self.Criteria.PayerSourceConcept(ko.observable());
        },
      },
      {
        ...constants.payerPlanAttributes.addPlanSourceConcept,
        selected: false,
        action: function () {
          if (self.Criteria.PlanSourceConcept() == null)
            self.Criteria.PlanSourceConcept(ko.observable());
        },
      },
      {
        ...constants.payerPlanAttributes.addSponsorSourceConcept,
        selected: false,
        action: function () {
          if (self.Criteria.SponsorSourceConcept() == null)
            self.Criteria.SponsorSourceConcept(ko.observable());
        },
      },
      {
        ...constants.payerPlanAttributes.addStopReasonSourceConcept,
        selected: false,
        action: function () {
          if (self.Criteria.StopReasonSourceConcept() == null)
            self.Criteria.StopReasonSourceConcept(ko.observable());
        },
      },
      {
        ...constants.payerPlanAttributes.addNested,
        selected: false,
        action: function () {
          if (self.Criteria.CorrelatedCriteria() == null)
            self.Criteria.CorrelatedCriteria(
              new CriteriaGroup(null, self.expression.ConceptSets)
            );
        },
      },
    ];

    self.removeCriterion = function (propertyName) {
      self.Criteria[propertyName](null);
    };

    self.indexMessage = ko.i18n('components.conditionPayerPlanPeriod.indexDataText', 'The index date refers to the payer plan period.');
  }

  return {
    viewModel: PayerPlanPeriodViewModel,
    template: template,
  };
});
