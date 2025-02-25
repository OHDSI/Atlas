define([
  "knockout",
  "../options",
  "../utils",
  "../InputTypes/Range",
  "../InputTypes/DateAdjustment",
  "../InputTypes/ConceptSetSelection",
  "../CriteriaGroup",
  "text!./ProcedureOccurrenceTemplate.html",
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
  function ProcedureOccurrenceViewModel(params) {
    var self = this;
    self.addActions = [
      {
        ...constants.procedureOccurrenceAttributes.addFirstDiagnosis,
        selected: false,
        action: function () {
          if (self.Criteria.First() == null) self.Criteria.First(true);
        },
      },
      {
        ...constants.procedureOccurrenceAttributes.addAge,
        selected: false,
        action: function () {
          if (self.Criteria.Age() == null) self.Criteria.Age(new Range());
        },
      },
      {
        ...constants.procedureOccurrenceAttributes.addGender,
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
        ...constants.procedureOccurrenceAttributes.addDate,
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
        ...constants.procedureOccurrenceAttributes.addDateAdjustment,
        selected: false,
        action: function () {
          if (self.Criteria.DateAdjustment() == null) self.Criteria.DateAdjustment(new DateAdjustment());
        },
      },
      {
        ...constants.procedureOccurrenceAttributes.addType,
        selected: false,
        action: function () {
          if (self.Criteria.ProcedureType() == null)
            self.Criteria.ProcedureType(ko.observableArray());
        },
      },
      {
        ...constants.procedureOccurrenceAttributes.addTypeCS,
        selected: false,
        action: function () {
          if (self.Criteria.ProcedureTypeCS() == null)
            self.Criteria.ProcedureTypeCS(new ConceptSetSelection({}, self.expression.ConceptSets));
        },
      },
      {
        ...constants.procedureOccurrenceAttributes.addVisit,
        selected: false,
        action: function () {
          if (self.Criteria.VisitType() == null)
            self.Criteria.VisitType(ko.observableArray());
        },
      },
      {
        ...constants.procedureOccurrenceAttributes.addVisitCS,
        selected: false,
        action: function () {
          if (self.Criteria.VisitTypeCS() == null)
            self.Criteria.VisitTypeCS(new ConceptSetSelection({}, self.expression.ConceptSets));
        },
      },
      {
        ...constants.procedureOccurrenceAttributes.addModifier,
        selected: false,
        action: function () {
          if (self.Criteria.Modifier() == null)
            self.Criteria.Modifier(ko.observableArray());
        },
      },
      {
        ...constants.procedureOccurrenceAttributes.addModifierCS,
        selected: false,
        action: function () {
          if (self.Criteria.ModifierCS() == null)
            self.Criteria.ModifierCS(new ConceptSetSelection({}, self.expression.ConceptSets));
        },
      },
      {
        ...constants.procedureOccurrenceAttributes.addQuantity,
        selected: false,
        action: function () {
          if (self.Criteria.Quantity() == null)
            self.Criteria.Quantity(
              new Range({
                Op: "lt",
              })
            );
        },
      },
      {
        ...constants.procedureOccurrenceAttributes.addSourceConcept,
        selected: false,
        action: function () {
          if (self.Criteria.ProcedureSourceConcept() == null)
            self.Criteria.ProcedureSourceConcept(ko.observable());
        },
      },
      {
        ...constants.procedureOccurrenceAttributes.addProviderSpecialty,
        selected: false,
        action: function () {
          if (self.Criteria.ProviderSpecialty() == null)
            self.Criteria.ProviderSpecialty(ko.observableArray());
        },
      },
      {
        ...constants.procedureOccurrenceAttributes.addProviderSpecialtyCS,
        selected: false,
        action: function () {
          if (self.Criteria.ProviderSpecialtyCS() == null)
            self.Criteria.ProviderSpecialtyCS(new ConceptSetSelection({}, self.expression.ConceptSets));
        },
      },
      {
        ...constants.procedureOccurrenceAttributes.addNested,
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
    self.Criteria = params.criteria.ProcedureOccurrence;
    self.options = options;

    self.removeCriterion = function (propertyName) {
      self.Criteria[propertyName](null);
    };

    self.indexMessage = ko.i18nformat(
      'components.conditionProcedureOccurrence.indexDataText',
      'The index date refers to the procedure of <%= conceptSetName %>.',
      {
        conceptSetName: ko.pureComputed(() => utils.getConceptSetName(
          self.Criteria.CodesetId,
          self.expression.ConceptSets,
          ko.i18n('components.conditionProcedureOccurrence.anyProcedure', 'Any Procedure')
        ))
      }
    );
  }

  // return compoonent definition
  return {
    viewModel: ProcedureOccurrenceViewModel,
    template: template,
  };
});
