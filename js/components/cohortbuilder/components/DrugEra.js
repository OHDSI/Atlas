define([
  "knockout",
  "../options",
  "../utils",
  "../InputTypes/Range",
  "../InputTypes/DateAdjustment",
  "../CriteriaGroup",
  "text!./DrugEraTemplate.html",
  "../const",
], function (ko, options, utils, Range, DateAdjustment, CriteriaGroup, template, constants) {
  function DrugEraViewModel(params) {
    var self = this;
    self.expression = ko.utils.unwrapObservable(params.expression);
    self.Criteria = params.criteria.DrugEra;
    self.options = options;
    self.addActions = [
      {
        ...constants.drugAttributes.addFirstDiagnosis,
        selected: false,
        action: function () {
          if (self.Criteria.First() == null) self.Criteria.First(true);
        },
      },
      {
        ...constants.drugAttributes.addAgeAtStart,
        selected: false,
        action: function () {
          if (self.Criteria.AgeAtStart() == null)
            self.Criteria.AgeAtStart(new Range());
        },
      },
      {
        ...constants.drugAttributes.addAgeAtEnd,
        selected: false,
        action: function () {
          if (self.Criteria.AgeAtEnd() == null)
            self.Criteria.AgeAtEnd(new Range());
        },
      },
      {
        ...constants.drugAttributes.addGender,
        selected: false,
        action: function () {
          if (self.Criteria.Gender() == null)
            self.Criteria.Gender(ko.observableArray());
        },
      },
      {
        ...constants.drugAttributes.addStartDate,
        selected: false,
        action: function () {
          if (self.Criteria.EraStartDate() == null)
            self.Criteria.EraStartDate(
              new Range({
                Op: "lt",
              })
            );
        },
      },
      {
        ...constants.drugAttributes.addEndDate,
        selected: false,
        action: function () {
          if (self.Criteria.EraEndDate() == null)
            self.Criteria.EraEndDate(
              new Range({
                Op: "lt",
              })
            );
        },
      },
      {
        ...constants.eraAttributes.addDateAdjustment,
        selected: false,
        action: function () {
          if (self.Criteria.DateAdjustment() == null) self.Criteria.DateAdjustment(new DateAdjustment());
        },
      },
      {
        ...constants.drugAttributes.addLength,
        selected: false,
        action: function () {
          if (self.Criteria.EraLength() == null)
            self.Criteria.EraLength(new Range());
        },
      },
      {
        ...constants.drugAttributes.addConditonCount,
        selected: false,
        action: function () {
          if (self.Criteria.OccurrenceCount() == null)
            self.Criteria.OccurrenceCount(new Range());
        },
      },
      {
        ...constants.drugAttributes.addNested,
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
    self.indexMessage = ko.i18nformat(
      'components.conditionDrug.indexDataText',
      'The index date refers to the drug era of <%= conceptSetName %>.',
      {
        conceptSetName: ko.pureComputed(() => utils.getConceptSetName(
          self.Criteria.CodesetId,
          self.expression.ConceptSets,
          ko.i18n('components.conditionDrug.anyDrug', 'Any Drug')
        ))
      }
    );
  }

  // return compoonent definition
  return {
    viewModel: DrugEraViewModel,
    template: template,
  };
});
