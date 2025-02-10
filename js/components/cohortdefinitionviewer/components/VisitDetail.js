define([
  "knockout",
  'components/cohortbuilder/options',
   "components/cohortbuilder/utils",
  "text!./VisitDetailTemplate.html",
], function (
  ko,
  options,
  utils,
  template
) {
  function VisitDetailViewModel(params) {
    var self = this;
    self.expression = ko.utils.unwrapObservable(params.expression);
    self.Criteria = params.criteria.VisitDetail;
    self.options = options;

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
