define([
  "knockout",
  "../options",
  "../utils",
  "../InputTypes/Range",
  "../InputTypes/DateAdjustment",
  "../InputTypes/Text",
  "../CriteriaGroup",
  "text!./SpecimenTemplate.html",
  "../const"
], function (ko, options, utils, Range, DateAdjustment, Text, CriteriaGroup, template, constants) {
  function SpecimenViewModel(params) {
    var self = this;
    self.expression = ko.utils.unwrapObservable(params.expression);
    self.Criteria = params.criteria.Specimen;
    self.options = options;

    self.addActions = [
      {
        ...constants.specimenAttributes.addFirstDiagnosis,
        selected: false,
        action: function () {
          if (self.Criteria.First() == null) self.Criteria.First(true);
        },
      },
      {
        ...constants.specimenAttributes.addAge,
        selected: false,
        action: function () {
          if (self.Criteria.Age() == null) self.Criteria.Age(new Range());
        },
      },
      {
        ...constants.specimenAttributes.addGender,
        selected: false,
        action: function () {
          if (self.Criteria.Gender() == null)
            self.Criteria.Gender(ko.observableArray());
        },
      },
      {
        ...constants.specimenAttributes.addDate,
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
        ...constants.specimenAttributes.addDateAdjustment,
        selected: false,
        action: function () {
          if (self.Criteria.DateAdjustment() == null) self.Criteria.DateAdjustment(new DateAdjustment());
        },
      },
      {
        ...constants.specimenAttributes.addType,
        selected: false,
        action: function () {
          if (self.Criteria.SpecimenType() == null)
            self.Criteria.SpecimenType(ko.observableArray());
        },
      },
      {
        ...constants.specimenAttributes.addQuantity,
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
        ...constants.specimenAttributes.addUnit,
        selected: false,
        action: function () {
          if (self.Criteria.Unit() == null)
            self.Criteria.Unit(ko.observableArray());
        },
      },
      {
        ...constants.specimenAttributes.addAnatomicSite,
        selected: false,
        action: function () {
          if (self.Criteria.AnatomicSite() == null)
            self.Criteria.AnatomicSite(ko.observableArray());
        },
      },
      {
        ...constants.specimenAttributes.addDiseaseStatus,
        selected: false,
        action: function () {
          if (self.Criteria.DiseaseStatus() == null)
            self.Criteria.DiseaseStatus(ko.observableArray());
        },
      },
      {
        ...constants.specimenAttributes.addSourceId,
        selected: false,
        action: function () {
          if (self.Criteria.SourceId() == null)
            self.Criteria.SourceId(
              new Text({
                Op: "contains",
              })
            );
        },
      },
      {
        ...constants.specimenAttributes.addNested,
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
      'components.conditionSpecimen.indexDataText',
      'The index date refers to the specimen of <%= conceptSetName %>.',
      {
        conceptSetName: ko.pureComputed(() => utils.getConceptSetName(
          self.Criteria.CodesetId,
          self.expression.ConceptSets,
          ko.i18n('components.conditionSpecimen.anySpecimen', 'Any Specimen')
        ))
      }
    );
  }

  // return compoonent definition
  return {
    viewModel: SpecimenViewModel,
    template: template,
  };
});
