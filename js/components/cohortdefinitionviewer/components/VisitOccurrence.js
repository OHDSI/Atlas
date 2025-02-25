define(['knockout','components/cohortbuilder/options','components/cohortbuilder/InputTypes/Range', 'text!./VisitOccurrenceTemplate.html'], function (ko, options, Range, template) {

	function VisitOccurrenceViewModel(params) {
		var self = this;

		self.expression = ko.utils.unwrapObservable(params.expression);
		self.Criteria = params.criteria.VisitOccurrence;
		self.options = options;

    self.indexMessage = ko.i18nformat(
      'components.conditionVisit.indexDataText',
      'The index date refers to the visit of <%= conceptSetName %>.',
      {
        conceptSetName: ko.pureComputed(() => utils.getConceptSetName(
          self.Criteria.CodesetId,
          self.expression.ConceptSets,
          ko.i18n('components.conditionVisit.anyVisit', 'Any Visit')
        ))
      }
    );
		
	}

	// return compoonent definition
	return {
		viewModel: VisitOccurrenceViewModel,
		template: template
	};
});