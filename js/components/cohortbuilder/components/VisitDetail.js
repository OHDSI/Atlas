define([
  "knockout",
  "appConfig",
  "../options",
  "../utils",
  "../InputTypes/Range",
  "../InputTypes/DateAdjustment",
  "../InputTypes/ConceptSetSelection",
  "../CriteriaGroup",
  "text!./VisitDetailTemplate.html",
  "../const",
], function (
  ko,
  config,
  options,
  utils,
  Range,
  DateAdjustment,
  ConceptSetSelection,
  CriteriaGroup,
  template,
  constants
) {
  function VisitDetailViewModel(params) {
    var self = this;

    self.addActions = [
      {
        ...constants.visitDetailAttributes.addFirstDiagnosis,
        selected: false,
        action: function () {
          if (self.Criteria.First() == null) self.Criteria.First(true);
        },
      },
      {
        ...constants.visitDetailAttributes.addAge,
        selected: false,
        action: function () {
          if (self.Criteria.Age() == null) self.Criteria.Age(new Range());
        },
      },
      {
        ...constants.visitDetailAttributes.addGenderCS,
        selected: false,
        action: function () {
          if (self.Criteria.GenderCS() == null)
            self.Criteria.GenderCS(new ConceptSetSelection({}, self.expression.ConceptSets));
        },
      },
      {
        ...constants.visitDetailAttributes.addStartDate,
        selected: false,
        action: function () {
          if (self.Criteria.VisitDetailStartDate() == null)
            self.Criteria.VisitDetailStartDate(
              new Range({
                Op: "lt",
              })
            );
        },
      },
      {
        ...constants.visitDetailAttributes.addEndDate,
        selected: false,
        action: function () {
          if (self.Criteria.VisitDetailEndDate() == null)
            self.Criteria.VisitDetailEndDate(
              new Range({
                Op: "lt",
              })
            );
        },
      },
      {
        ...constants.visitDetailAttributes.addDateAdjustment,
        selected: false,
        action: function () {
          if (self.Criteria.DateAdjustment() == null) self.Criteria.DateAdjustment(new DateAdjustment());
        },
      },
      {
        ...constants.visitDetailAttributes.addTypeCS,
        selected: false,
        action: function () {
          if (self.Criteria.VisitDetailTypeCS() == null)
            self.Criteria.VisitDetailTypeCS(new ConceptSetSelection({}, self.expression.ConceptSets));
        },
      },
      {
        ...constants.visitDetailAttributes.addLength,
        selected: false,
        action: function () {
          if (self.Criteria.VisitDetailLength() == null)
            self.Criteria.VisitDetailLength(new Range());
        },
      },
      {
        ...constants.visitDetailAttributes.addSourceConcept,
        selected: false,
        action: function () {
          if (self.Criteria.VisitDetailSourceConcept() == null)
            self.Criteria.VisitDetailSourceConcept(ko.observable());
        },
      },
      {
        ...constants.visitDetailAttributes.addProviderSpecialtyCS,
        selected: false,
        action: function () {
          if (self.Criteria.ProviderSpecialtyCS() == null)
            self.Criteria.ProviderSpecialtyCS(new ConceptSetSelection({}, self.expression.ConceptSets));
        },
      },
      {
        ...constants.visitDetailAttributes.addPlaceServiceCS,
        selected: false,
        action: function () {
          if (self.Criteria.PlaceOfServiceCS() == null)
            self.Criteria.PlaceOfServiceCS(new ConceptSetSelection({}, self.expression.ConceptSets));
        },
      },
      {
        ...constants.visitDetailAttributes.addPlaceServiceLocation,
        selected: false,
        action: function () {
          if (self.Criteria.PlaceOfServiceLocation() == null) {
            self.Criteria.PlaceOfServiceLocation(ko.observable());
          }
        },
      },
      {
        ...constants.visitDetailAttributes.addNested,
        selected: false,
        action: function () {
          if (self.Criteria.CorrelatedCriteria() == null)
            self.Criteria.CorrelatedCriteria(
              new CriteriaGroup(null, self.expression.ConceptSets)
            );
        },
      },
    ];

    if (config.features.locationDistance) {
      self.addActions.splice(self.addActions.length - 1, 0, {
        ...constants.visitDetailAttributes.addPlaceServiceDistance,
        selected: false,
        action: function () {
          if (self.Criteria.PlaceOfServiceDistance() == null) {
            self.Criteria.PlaceOfServiceDistance(new Range());
          }
        },
      });
    }

    self.expression = ko.utils.unwrapObservable(params.expression);
    self.Criteria = params.criteria.VisitDetail;
    self.options = options;

    self.removeCriterion = function (propertyName) {
			self.Criteria[propertyName](null);
		}

    self.indexMessage = ko.i18nformat(
      'components.conditionVisitDetail.indexDataText',
      'The index date refers to the visit detail of <%= conceptSetName %>.',
      {
        conceptSetName: ko.pureComputed(() => utils.getConceptSetName(
          self.Criteria.CodesetId,
          self.expression.ConceptSets,
          ko.i18n('components.conditionVisitDetail.anyVisitDetail', 'Any Visit Detail')
        ))
      }
    );
  }

  // return component definition
  return {
    viewModel: VisitDetailViewModel,
    template: template,
  };
});
