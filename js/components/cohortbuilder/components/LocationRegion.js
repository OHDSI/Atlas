define([
  "knockout",
  "../options",
  "../utils",
  "../InputTypes/Range",
  "../CriteriaGroup",
  "text!./LocationRegionTemplate.html",
], function (ko, options, utils, Range, CriteriaGroup, template) {
  function LocationRegionViewModel(params) {
    var self = this;
    self.expression = ko.utils.unwrapObservable(params.expression);
    self.Criteria = params.criteria.LocationRegion;
    self.options = options;

    self.addActions = [
      {
        text: ko.i18n('components.locationRegion.criteria.startDate.option.text', 'Add Start Date Criteria...'),
        selected: false,
        description: ko.i18n('components.locationRegion.criteria.startDate.option.description', 'Filter Locations by date when Person started living there'),
        action: function () {
          if (self.Criteria.StartDate() == null)
            self.Criteria.StartDate(
              new Range({
                Op: "lt",
              })
            );
        },
      },
      {
        text: ko.i18n('components.locationRegion.criteria.endDate.option.text', 'Add End Date Criteria...'),
        selected: false,
        description: ko.i18n('components.locationRegion.criteria.endDate.option.description', 'Filter Locations by date when Person finished living there'),
        action: function () {
          if (self.Criteria.EndDate() == null)
            self.Criteria.EndDate(
              new Range({
                Op: "lt",
              })
            );
        },
      },
      {
        text: ko.i18n('components.locationRegion.criteria.correlatedCriteria.option.text', 'Add Nested Criteria...'),
        selected: false,
        description: ko.i18n('components.locationRegion.criteria.correlatedCriteria.option.description', 'Apply criteria using the location region as the index event'),
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
      'components.locationRegion.criteria.indexData.text',
      'The index date refers to the location region of <%= conceptSetName %>.',
      {
        conceptSetName: ko.pureComputed(() => utils.getConceptSetName(
          self.Criteria.CodesetId,
          self.expression.ConceptSets,
          ko.i18n('components.locationRegion.anyLocationRegion', 'Any Region')
        ))
      }
    );
  }

  // return compoonent definition
  return {
    viewModel: LocationRegionViewModel,
    template: template,
  };
});
