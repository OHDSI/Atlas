define(['knockout', 'components/cohortbuilder/options', 'components/cohortbuilder/utils', 'text!./ProcedureOccurrenceTemplate.html'
], function (ko, options, utils, template) {

	function ProcedureOccurrenceViewModel(params) {
		var self = this;

		self.expression = ko.utils.unwrapObservable(params.expression);
		self.Criteria = params.criteria.ProcedureOccurrence;
		self.options = options;

    self.indexMessage = ko.i18nformat(
      'components.conditionProcedureOccurrence.indexDataText',
      'The index date refers to the procedure of <%= conceptSetName %>.',
      {
        conceptSetName: ko.pureComputed(() => utils.getConceptSetName(
          self.Criteria.CodesetId,
          self.expression.ConceptSets,
          ko.i18n('components.conditionProcedureOccurrence.anyProcedure', 'Any Procedure')
        ))
      }
    );
		
	}

	// return compoonent definition
	return {
		viewModel: ProcedureOccurrenceViewModel,
		template: template
	};
});