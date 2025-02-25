define(['knockout','components/cohortbuilder/options','components/cohortbuilder/utils', 'text!./DeathTemplate.html'
], function (ko, options, utils, template) {

	function DeathViewModel(params) {
		var self = this;

		self.expression = ko.utils.unwrapObservable(params.expression);
		self.Criteria = params.criteria.Death;
		self.options = options;

    self.indexMessage = ko.i18nformat(
      'components.conditionDeath.indexDataText',
      'The index date refers to the death event of <%= conceptSetName %>.',
      {
        conceptSetName: ko.pureComputed(() => utils.getConceptSetName(
          self.Criteria.CodesetId,
          self.expression.ConceptSets,
          ko.i18n('components.conditionDeath.anyDeath', 'Any Death')
        ))
      }
    );

	}

	// return compoonent definition
	return {
		viewModel: DeathViewModel,
		template: template
	};
});