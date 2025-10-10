define([
  "knockout",
  "../options",
  "../utils",
  "../InputTypes/Range",
  "../InputTypes/DateAdjustment",
  "../InputTypes/ConceptSetSelection",
  "../InputTypes/Text",
  "../CriteriaGroup",
  "text!./DrugExposureTemplate.html",
  "../const",
], function (
  ko,
  options,
  utils,
  Range,
  DateAdjustment,
  ConceptSetSelection,
  Text,
  CriteriaGroup,
  template,
  constants
) {
  function DrugExposureViewModel(params) {
    var self = this;
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
        ...constants.drugexposureAttributes.addFirstDiagnosis,
        selected: false,
        action: function () {
          if (self.Criteria.First() == null) self.Criteria.First(true);
        },
      },
      {
        ...constants.drugexposureAttributes.addAge,
        selected: false,
        action: function () {
          if (self.Criteria.Age() == null) self.Criteria.Age(new Range());
        },
      },
      {
        ...constants.drugexposureAttributes.addGender,
        selected: false,
        action: function () {
          if (self.Criteria.Gender() == null)
            self.Criteria.Gender(ko.observableArray());
        },
      },
      {
        ...constants.drugexposureAttributes.addGenderCS,
        selected: false,
        action: function () {
          if (self.Criteria.GenderCS() == null)
            self.Criteria.GenderCS(new ConceptSetSelection({}, self.expression.ConceptSets));
        },
      },
      {
        ...constants.drugexposureAttributes.addStartDate,
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
        ...constants.drugexposureAttributes.addEndDate,
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
        ...constants.drugexposureAttributes.addDateAdjustment,
        selected: false,
        action: function () {
          if (self.Criteria.DateAdjustment() == null) self.Criteria.DateAdjustment(new DateAdjustment());
        },
      },
      {
        ...constants.drugexposureAttributes.addType,
        selected: false,
        action: function () {
          if (self.Criteria.DrugType() == null)
            self.Criteria.DrugType(ko.observableArray());
        },
      },
      {
        ...constants.drugexposureAttributes.addTypeCS,
        selected: false,
        action: function () {
          if (self.Criteria.DrugTypeCS() == null)
            self.Criteria.DrugTypeCS(new ConceptSetSelection({}, self.expression.ConceptSets));
        },
      },
      {
        ...constants.drugexposureAttributes.addVisit,
        selected: false,
        action: function () {
          if (self.Criteria.VisitType() == null)
            self.Criteria.VisitType(ko.observableArray());
        },
      },
      {
        ...constants.drugexposureAttributes.addVisitCS,
        selected: false,
        action: function () {
          if (self.Criteria.VisitTypeCS() == null)
            self.Criteria.VisitTypeCS(new ConceptSetSelection({}, self.expression.ConceptSets));
        },
      },
      {
        ...constants.drugexposureAttributes.addStopReason,
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
        ...constants.drugexposureAttributes.addRefills,
        selected: false,
        action: function () {
          if (self.Criteria.Refills() == null)
            self.Criteria.Refills(
              new Range({
                Op: "lt",
              })
            );
        },
      },
      {
        ...constants.drugexposureAttributes.addQuantity,
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
        ...constants.drugexposureAttributes.addDaysSupply,
        selected: false,
        action: function () {
          if (self.Criteria.DaysSupply() == null)
            self.Criteria.DaysSupply(
              new Range({
                Op: "lt",
              })
            );
        },
      },
      {
        ...constants.drugexposureAttributes.addRoute,
        selected: false,
        action: function () {
          if (self.Criteria.RouteConcept() == null)
            self.Criteria.RouteConcept(ko.observableArray());
        },
      },
      {
        ...constants.drugexposureAttributes.addRouteCS,
        selected: false,
        action: function () {
          if (self.Criteria.RouteConceptCS() == null)
            self.Criteria.RouteConceptCS(new ConceptSetSelection({}, self.expression.ConceptSets));
        },
      },
      {
        ...constants.drugexposureAttributes.addEffective,
        selected: false,
        action: function () {
          if (self.Criteria.EffectiveDrugDose() == null)
            self.Criteria.EffectiveDrugDose(
              new Range({
                Op: "lt",
              })
            );
        },
      },
      {
        ...constants.drugexposureAttributes.addUnit,
        selected: false,
        action: function () {
          if (self.Criteria.DoseUnit() == null)
            self.Criteria.DoseUnit(ko.observableArray());
        },
      },
      {
        ...constants.drugexposureAttributes.addUnitCS,
        selected: false,
        action: function () {
          if (self.Criteria.DoseUnitCS() == null)
            self.Criteria.DoseUnitCS(new ConceptSetSelection({}, self.expression.ConceptSets));
        },
      },
      {
        ...constants.drugexposureAttributes.addLotNumber,
        selected: false,
        action: function () {
          if (self.Criteria.LotNumber() == null)
            self.Criteria.LotNumber(
              new Text({
                Op: "contains",
              })
            );
        },
      },
      {
        ...constants.drugexposureAttributes.addSource,
        selected: false,
        action: function () {
          if (self.Criteria.DrugSourceConcept() == null)
            self.Criteria.DrugSourceConcept(ko.observable());
        },
      },
      {
        ...constants.drugexposureAttributes.addProviderSpecialty,
        selected: false,
        action: function () {
          if (self.Criteria.ProviderSpecialty() == null)
            self.Criteria.ProviderSpecialty(ko.observableArray());
        },
      },
      {
        ...constants.drugexposureAttributes.addProviderSpecialtyCS,
        selected: false,
        action: function () {
          if (self.Criteria.ProviderSpecialtyCS() == null)
            self.Criteria.ProviderSpecialtyCS(new ConceptSetSelection({}, self.expression.ConceptSets));
        },
      },
      {
        ...constants.drugexposureAttributes.addNested,
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
    self.Criteria = params.criteria.DrugExposure;
    self.options = options;

    self.removeCriterion = function (propertyName) {
      self.Criteria[propertyName](null);
    };
    self.indexMessage = ko.i18nformat(
      'components.conditionDrugExposure.indexDataText',
      'The index date refers to the drug exposure of <%= conceptSetName %>.',
      {
        conceptSetName: ko.pureComputed(() => utils.getConceptSetName(
          self.Criteria.CodesetId,
          self.expression.ConceptSets,
          ko.i18n('components.conditionDrugExposure.anyDrug', 'Any Drug')
        ))
      }
    );
  }

  // return compoonent definition
  return {
    viewModel: DrugExposureViewModel,
    template: template,
  };
});
