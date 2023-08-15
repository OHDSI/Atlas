define([
  "knockout",
  "../options",
  "../utils",
  "../InputTypes/Range",
  "../InputTypes/Text",
  "../InputTypes/DateAdjustment",
  "../CriteriaGroup",
  "text!./ConditionOccurrenceTemplate.html",
  "../const",
  "./ConceptSetSelector",
], function (
  ko,
  options,
  utils,
  Range,
  Text,
  DateAdjustment,
  CriteriaGroup,
  template,
  constants
) {
  function ConditionOccurrenceViewModel(params) {
    var self = this;
    self.expression = ko.utils.unwrapObservable(params.expression);
    self.Criteria = params.criteria.ConditionOccurrence;
    self.options = options;

    self.formatOption = function (d) {
      return (
        '<div class="optionText">' +
        d.text +
        "</div>" +
        '<div class="optionDescription">' +
        d.description +
        "</div>"
      );
    };

    self.addActions = [
      {
        ...constants.occurrenceAttributes.addFirstDiagnosis,
        selected: false,
        action: function () {
          if (self.Criteria.First() == null) self.Criteria.First(true);
        },
      },
      {
        ...constants.occurrenceAttributes.addAge,
        selected: false,
        action: function () {
          if (self.Criteria.Age() == null) self.Criteria.Age(new Range());
        },
      },
      {
        ...constants.occurrenceAttributes.addGender,
        selected: false,
        action: function () {
          if (self.Criteria.Gender() == null)
            self.Criteria.Gender(ko.observableArray());
        },
      },
      {
        ...constants.occurrenceAttributes.addConditionStatus,
        selected: false,
        action: function () {
            if (self.Criteria.ConditionStatus() == null)
                self.Criteria.ConditionStatus(ko.observableArray());
        }
      },
      {
        ...constants.occurrenceAttributes.addStartDate,
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
        ...constants.occurrenceAttributes.addEndDate,
        selected: false,
        action: function () {
          if (self.Criteria.OccurrenceEndDate() == null)
            self.Criteria.OccurrenceEndDate(
              new Range({
                Op: "lt",
              })
            );
        },
      },
      {
        ...constants.occurrenceAttributes.addDateAdjustment,
        selected: false,
        action: function () {
          if (self.Criteria.DateAdjustment() == null) self.Criteria.DateAdjustment(new DateAdjustment());
        },
      },
      {
        ...constants.occurrenceAttributes.addType,
        selected: false,
        action: function () {
          if (self.Criteria.ConditionType() == null)
            self.Criteria.ConditionType(ko.observableArray());
        },
      },
      {
        ...constants.occurrenceAttributes.addVisit,
        selected: false,
        action: function () {
          if (self.Criteria.VisitType() == null)
            self.Criteria.VisitType(ko.observableArray());
        },
      },
      {
        ...constants.occurrenceAttributes.addStopReason,
        selected: false,
        action: function () {
          if (self.Criteria.StopReason() == null)
            self.Criteria.StopReason(
              new Text({
                Op: "contains",
              })
            );
        },
      },
      {
        ...constants.occurrenceAttributes.addSourceConcept,
        selected: false,
        action: function () {
          if (self.Criteria.ConditionSourceConcept() == null)
            self.Criteria.ConditionSourceConcept(ko.observable());
        },
      },
      {
        ...constants.occurrenceAttributes.addProviderSpecialty,
        selected: false,
        action: function () {
          if (self.Criteria.ProviderSpecialty() == null)
            self.Criteria.ProviderSpecialty(ko.observableArray());
        },
      },
      {
        ...constants.occurrenceAttributes.addNested,
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
      'components.conditionOccurrence.indexDataText',
      'The index date refers to the condition occurrence of <%= conceptSetName %>.',
      {
        conceptSetName: ko.pureComputed(() => utils.getConceptSetName(
          self.Criteria.CodesetId,
          self.expression.ConceptSets,
          ko.i18n('components.conditionOccurrence.anyCondition', 'Any Condition')
        )),
      }
    );
  }

  // return compoonent definition
  return {
    viewModel: ConditionOccurrenceViewModel,
    template: template,
  };
});
