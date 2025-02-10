define(['knockout', 'components/cohortbuilder/options', "components/cohortbuilder/utils", 'text!./ConditionOccurrenceTemplate.html'
], function (ko, options, utils, template) {

	function ConditionOccurrenceViewModel(params) {

		var self = this;
		self.expression = ko.utils.unwrapObservable(params.expression);
		self.Criteria = params.criteria.ConditionOccurrence;
		self.options = options;

    self.indexMessage = ko.i18nformat(
      'components.conditionOccurrence.indexDataText',
      'The index date refers to the condition occurrence of <%= conceptSetName %>.',
      {
        conceptSetName: ko.pureComputed(() => utils.getConceptSetName(
          self.Criteria.CodesetId,
          self.expression.ConceptSets,
          ko.i18n('components.conditionOccurrence.anyCondition', 'Any Condition')
        )),
      }
    );
	}

	// return compoonent definition
	return {
		viewModel: ConditionOccurrenceViewModel,
		template: template
	};
});
