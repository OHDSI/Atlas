define([
  "knockout",
  "../options",
  "../utils",
  "../InputTypes/Range",
  "../InputTypes/Text",
  "../InputTypes/DateAdjustment",
  "../CriteriaGroup",
  "text!./DeviceExposureTemplate.html",
  "../const",
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
  function DeviceExposureViewModel(params) {
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
        ...constants.deviceAttributes.addFirstDiagnosis,
        selected: false,
        action: function () {
          if (self.Criteria.First() == null) self.Criteria.First(true);
        },
      },
      {
        ...constants.deviceAttributes.addAge,
        selected: false,
        action: function () {
          if (self.Criteria.Age() == null) self.Criteria.Age(new Range());
        },
      },
      {
        ...constants.deviceAttributes.addGender,
        selected: false,
        action: function () {
          if (self.Criteria.Gender() == null)
            self.Criteria.Gender(ko.observableArray());
        },
      },
      {
        ...constants.deviceAttributes.addStartDate,
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
        ...constants.deviceAttributes.addEndDate,
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
        ...constants.deviceAttributes.addDateAdjustment,
        selected: false,
        action: function () {
          if (self.Criteria.DateAdjustment() == null) self.Criteria.DateAdjustment(new DateAdjustment());
        },
      },
      {
        ...constants.deviceAttributes.addType,
        selected: false,
        action: function () {
          if (self.Criteria.DeviceType() == null)
            self.Criteria.DeviceType(ko.observableArray());
        },
      },
      {
        ...constants.deviceAttributes.addVisit,
        selected: false,
        action: function () {
          if (self.Criteria.VisitType() == null)
            self.Criteria.VisitType(ko.observableArray());
        },
      },
      {
        ...constants.deviceAttributes.addUniqueId,
        selected: false,
        action: function () {
          if (self.Criteria.UniqueDeviceId() == null)
            self.Criteria.UniqueDeviceId(
              new Text({
                Op: "contains",
              })
            );
        },
      },
      {
        ...constants.deviceAttributes.addQuantity,
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
        ...constants.deviceAttributes.addSourceConcept,
        selected: false,
        action: function () {
          if (self.Criteria.DeviceSourceConcept() == null)
            self.Criteria.DeviceSourceConcept(ko.observable());
        },
      },
      {
        ...constants.deviceAttributes.addProviderSpecialty,
        selected: false,
        action: function () {
          if (self.Criteria.ProviderSpecialty() == null)
            self.Criteria.ProviderSpecialty(ko.observableArray());
        },
      },
      {
        ...constants.deviceAttributes.addNested,
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
    self.Criteria = params.criteria.DeviceExposure;
    self.options = options;

    self.removeCriterion = function (propertyName) {
      self.Criteria[propertyName](null);
    };

    self.indexMessage = ko.i18nformat(
      'components.conditionDevice.indexDataText',
      'The index date refers to the device exposure of <%= conceptSetName %>.',
      {
        conceptSetName: ko.pureComputed(() => utils.getConceptSetName(
          self.Criteria.CodesetId,
          self.expression.ConceptSets,
          ko.i18n('components.conditionDevice.anyDevice', 'Any Device')
        ))
      }
    );
  }

  // return compoonent definition
  return {
    viewModel: DeviceExposureViewModel,
    template: template,
  };
});
