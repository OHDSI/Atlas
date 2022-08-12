define([
  "knockout",
  "appConfig",
  "../options",
  "../utils",
  "../InputTypes/Range",
  "../CriteriaGroup",
  "text!./VisitDetailsTemplate.html",
  "../const",
], function (
  ko,
  config,
  options,
  utils,
  Range,
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
        ...constants.visitDetailAttributes.addGender,
        selected: false,
        action: function () {
          if (self.Criteria.Gender() == null)
            self.Criteria.Gender(ko.observableArray());
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
        ...constants.visitDetailAttributes.addType,
        selected: false,
        action: function () {
          if (self.Criteria.VisitDetailType() == null)
            self.Criteria.VisitDetailType(ko.observableArray());
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
        ...constants.visitDetailAttributes.addProviderSpecialty,
        selected: false,
        action: function () {
          if (self.Criteria.ProviderSpecialty() == null)
            self.Criteria.ProviderSpecialty(ko.observableArray());
        },
      },
      {
        ...constants.visitDetailAttributes.addPlaceService,
        selected: false,
        action: function () {
          if (self.Criteria.PlaceOfService() == null)
            self.Criteria.PlaceOfService(ko.observableArray());
        },
      },
      {
        ...constants.visitDetailAttributes.addPlaceServiceLocation,
        selected: false,
        action: function () {
          if (self.Criteria.PlaceOfServiceLocation() === null) {
            self.Criteria.PlaceOfServiceLocation(ko.observable());
          }
        },
      },
      {
        ...constants.visitDetailAttributes.addAdmittedFromConcept,
        selected: false,
        action: function () {
          if (self.Criteria.AdmittedFromConcept() == null)
            self.Criteria.AdmittedFromConcept(ko.observableArray());
        },
      },
      {
        ...constants.visitDetailAttributes.addDischargedToConcept,
        selected: false,
        action: function () {
          if (self.Criteria.DischargedToConcept() == null)
            self.Criteria.DischargedToConcept(ko.observableArray());
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
          if (self.Criteria.PlaceOfServiceDistance() === null) {
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
      'components.conditionVisitDetails.indexDataText',
      'The index date refers to the visit details of <%= conceptSetName %>.',
      {
        conceptSetName: utils.getConceptSetName(
          self.Criteria.CodesetId,
          self.expression.ConceptSets,
          ko.i18n('components.conditionVisitDetails.anyVisitDetails', 'Any Visit details')
        )
      }
    );
  }

  // return component definition
  return {
    viewModel: VisitDetailViewModel,
    template: template,
  };
});
