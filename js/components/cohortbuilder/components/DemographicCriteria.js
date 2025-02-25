define([
  "knockout",
  "../options",
  "../InputTypes/Range",
  "../utils",
  '../InputTypes/ConceptSetSelection',
  "text!./DemographicCriteriaTemplate.html",
  "../const",
  "./ConceptSetSelector",
], function (ko, options, Range, utils, ConceptSetSelection, template, constants, ) {
  function DemographicCriteriaViewModel(params) {
    var self = this;
    self.expression = ko.utils.unwrapObservable(params.expression);
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
        ...constants.demographicAttributes.addGenderCS,
        selected: false,
        action: function () {
          if (self.Criteria.GenderCS() == null)
            self.Criteria.GenderCS(new ConceptSetSelection({}, self.expression.ConceptSets));
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
        ...constants.demographicAttributes.addRaceCS,
        selected: false,
        action: function () {
          if (self.Criteria.RaceCS() == null)
            self.Criteria.RaceCS(new ConceptSetSelection({}, self.expression.ConceptSets));
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
      {
        ...constants.demographicAttributes.addEthnicityCS,
        selected: false,
        action: function () {
          if (self.Criteria.EthnicityCS() == null)
            self.Criteria.EthnicityCS(new ConceptSetSelection({}, self.expression.ConceptSets));
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
