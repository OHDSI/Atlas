define([
  "knockout",
  "../options",
  "../InputTypes/Range",
  "../utils",
  "text!./DemographicCriteriaTemplate.html",
  "../const",
  "./ConceptSetSelector",
], function (ko, options, Range, utils, template, constants) {
  function DemographicCriteriaViewModel(params) {
    var self = this;
    self.Criteria = ko.utils.unwrapObservable(params.criteria);
    self.options = options;
    self.formatOption = utils.formatDropDownOption;
    self.addActions = [
      {
        ...constants.demographicAttributes.addAge,
        selected: false,
        action: function () {
          if (self.Criteria.Age() == null) self.Criteria.Age(new Range());
        },
      },
      {
        ...constants.demographicAttributes.addGender,
        selected: false,
        action: function () {
          if (self.Criteria.Gender() == null)
            self.Criteria.Gender(ko.observableArray());
        },
      },
      {
        ...constants.demographicAttributes.addStartDate,
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
        ...constants.demographicAttributes.addEndDate,
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
        ...constants.demographicAttributes.addRace,
        selected: false,
        action: function () {
          if (self.Criteria.Race() == null)
            self.Criteria.Race(ko.observableArray());
        },
      },
      {
        ...constants.demographicAttributes.addEthnicity,
        selected: false,
        action: function () {
          if (self.Criteria.Ethnicity() == null)
            self.Criteria.Ethnicity(ko.observableArray());
        },
      },
    ];

    self.removeCriterion = function (propertyName) {
      self.Criteria[propertyName](null);
    };
  }

  // return compoonent definition
  return {
    viewModel: DemographicCriteriaViewModel,
    template: template,
  };
});
