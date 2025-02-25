define([
  "knockout",
  "../options",
  "../utils",
  "../InputTypes/Range",
  "../InputTypes/DateAdjustment",
  "../InputTypes/ConceptSetSelection",
  "../CriteriaGroup",
  "text!./DeathTemplate.html",
  "../const",
], function (
  ko,
  options,
  utils,
  Range,
  DateAdjustment,
  ConceptSetSelection,
  CriteriaGroup,
  template,
  constants
) {
  function DeathViewModel(params) {
    var self = this;

    self.addActions = [
      {
        ...constants.deathAttributes.addAge,
        selected: false,
        action: function () {
          if (self.Criteria.Age() == null) self.Criteria.Age(new Range());
        },
      },
      {
        ...constants.deathAttributes.addGender,
        selected: false,
        action: function () {
          if (self.Criteria.Gender() == null)
            self.Criteria.Gender(ko.observableArray());
        },
      },
      {
        ...constants.occurrenceAttributes.addGenderCS,
        selected: false,
        action: function () {
          if (self.Criteria.GenderCS() == null)
            self.Criteria.GenderCS(new ConceptSetSelection({}, self.expression.ConceptSets));
        },
      },
      {
        ...constants.deathAttributes.addDate,
        selected: false,
        action: function () {
          if (self.Criteria.OccurrenceStartDate() == null)
            self.Criteria.OccurrenceStartDate(
              new Range({
                Op: "lt",
              })
            );
        },
      },
      {
        ...constants.deathAttributes.addDateAdjustment,
        selected: false,
        action: function () {
          if (self.Criteria.DateAdjustment() == null) self.Criteria.DateAdjustment(new DateAdjustment());
        },
      },
      {
        ...constants.deathAttributes.addType,
        selected: false,
        action: function () {
          if (self.Criteria.DeathType() == null)
            self.Criteria.DeathType(ko.observableArray());
        },
      },
      {
        ...constants.deathAttributes.addTypeCS,
        selected: false,
        action: function () {
          if (self.Criteria.DeathTypeCS() == null)
            self.Criteria.DeathTypeCS(new ConceptSetSelection({}, self.expression.ConceptSets));
        },
      },
      {
        ...constants.deathAttributes.addSourceConcept,
        selected: false,
        action: function () {
          if (self.Criteria.DeathSourceConcept() == null)
            self.Criteria.DeathSourceConcept(ko.observable());
        },
      },
      {
        ...constants.deathAttributes.addNested,
        selected: false,
        action: function () {
          if (self.Criteria.CorrelatedCriteria() == null)
            self.Criteria.CorrelatedCriteria(
              new CriteriaGroup(null, self.expression.ConceptSets)
            );
        },
      },
    ];

    self.expression = ko.utils.unwrapObservable(params.expression);
    self.Criteria = params.criteria.Death;
    self.options = options;

    self.removeCriterion = function (propertyName) {
      self.Criteria[propertyName](null);
    };

    self.indexMessage = ko.i18nformat(
      'components.conditionDeath.indexDataText',
      'The index date refers to the death event of <%= conceptSetName %>.',
      {
        conceptSetName: ko.pureComputed(() => utils.getConceptSetName(
          self.Criteria.CodesetId,
          self.expression.ConceptSets,
          ko.i18n('components.conditionDeath.anyDeath', 'Any Death')
        ))
      }
    );
  }

  // return compoonent definition
  return {
    viewModel: DeathViewModel,
    template: template,
  };
});
