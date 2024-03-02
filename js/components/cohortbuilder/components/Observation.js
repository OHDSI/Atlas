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
        ...constants.observationAttributes.addValueAsConcept,
        selected: false,
        action: function () {
          if (self.Criteria.ValueAsConcept() == null)
            self.Criteria.ValueAsConcept(ko.observableArray());
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
