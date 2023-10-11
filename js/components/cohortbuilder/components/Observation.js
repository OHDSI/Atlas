define([
  "knockout",
  "../options",
  "../utils",
  "../InputTypes/Range",
  "../InputTypes/DateAdjustment",
  "../InputTypes/Text",
  "../CriteriaGroup",
  "text!./ObservationTemplate.html",
  "../const"
], function (ko, options, utils, Range, DateAdjustment, Text, CriteriaGroup, template, constants) {
  function ObservationViewModel(params) {
    var self = this;
    self.addActions = [
      {
        ...constants.observationAttributes.addFirstDiagnosis,
        selected: false,
        action: function () {
          if (self.Criteria.First() == null) self.Criteria.First(true);
        },
      },
      {
        ...constants.observationAttributes.addAge,
        selected: false,
        action: function () {
          if (self.Criteria.Age() == null) self.Criteria.Age(new Range());
        },
      },
      {
        ...constants.observationAttributes.addGender,
        selected: false,
        action: function () {
          if (self.Criteria.Gender() == null)
            self.Criteria.Gender(ko.observableArray());
        },
      },
      {
        ...constants.observationAttributes.addDate,
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
        ...constants.observationAttributes.addDateAdjustment,
        selected: false,
        action: function () {
          if (self.Criteria.DateAdjustment() == null) self.Criteria.DateAdjustment(new DateAdjustment());
        },
      },
      {
        ...constants.observationAttributes.addType,
        selected: false,
        action: function () {
          if (self.Criteria.ObservationType() == null)
            self.Criteria.ObservationType(ko.observableArray());
        },
      },
      {
        ...constants.observationAttributes.addVisit,
        selected: false,
        action: function () {
          if (self.Criteria.VisitType() == null)
            self.Criteria.VisitType(ko.observableArray());
        },
      },
      {
        ...constants.observationAttributes.addValue,
        selected: false,
        action: function () {
          if (self.Criteria.ValueAsNumber() == null)
            self.Criteria.ValueAsNumber(
              new Range({
                Op: "lt",
              })
            );
        },
      },
      {
        ...constants.observationAttributes.addValueAsString,
        selected: false,
        action: function () {
          if (self.Criteria.ValueAsString() == null)
            self.Criteria.ValueAsString(
              new Text({
                Op: "contains",
              })
            );
        },
      },
      {
        ...constants.observationAttributes.addValueAsConcept,
        selected: false,
        action: function () {
          if (self.Criteria.ValueAsConcept() == null)
            self.Criteria.ValueAsConcept(ko.observableArray());
        },
      },
      {
        ...constants.observationAttributes.addQualifier,
        selected: false,
        action: function () {
          if (self.Criteria.Qualifier() == null)
            self.Criteria.Qualifier(ko.observableArray());
        },
      },
      {
        ...constants.observationAttributes.addUnit,
        selected: false,
        action: function () {
          if (self.Criteria.Unit() == null)
            self.Criteria.Unit(ko.observableArray());
        },
      },
      {
        ...constants.observationAttributes.addSourceConcept,
        selected: false,
        action: function () {
          if (self.Criteria.ObservationSourceConcept() == null)
            self.Criteria.ObservationSourceConcept(ko.observable());
        },
      },
      {
        ...constants.observationAttributes.addProviderSpecialty,
        selected: false,
        action: function () {
          if (self.Criteria.ProviderSpecialty() == null)
            self.Criteria.ProviderSpecialty(ko.observableArray());
        },
      },
      {
        ...constants.observationAttributes.addNested,
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
    self.Criteria = params.criteria.Observation;
    self.options = options;

    self.removeCriterion = function (propertyName) {
      self.Criteria[propertyName](null);
    };

    self.indexMessage = ko.i18nformat(
      'components.conditionObservation.indexDataText',
      'The index date refers to the observation of <%= conceptSetName %>.',
      {
        conceptSetName: ko.pureComputed(() => utils.getConceptSetName(
          self.Criteria.CodesetId,
          self.expression.ConceptSets,
          ko.i18n('components.conditionObservation.anyObservation', 'Any Observation')
        ))
      }
    );
  }

  // return compoonent definition
  return {
    viewModel: ObservationViewModel,
    template: template,
  };
});
