define(['knockout','components/cohortbuilder/options','components/cohortbuilder/InputTypes/Range', 'text!./DrugEraTemplate.html'], function (ko, options, Range, template) {

	function DrugEraViewModel(params) {
		
		var self = this;
		self.expression = ko.utils.unwrapObservable(params.expression);
		self.Criteria = params.criteria.DrugEra;
		self.options = options;

    self.indexMessage = ko.i18nformat(
      'components.conditionDrug.indexDataText',
      'The index date refers to the drug era of <%= conceptSetName %>.',
      {
        conceptSetName: ko.pureComputed(() => utils.getConceptSetName(
          self.Criteria.CodesetId,
          self.expression.ConceptSets,
          ko.i18n('components.conditionDrug.anyDrug', 'Any Drug')
        ))
      }
    );
		
	}

	// return compoonent definition
	return {
		viewModel: DrugEraViewModel,
		template: template
	};
});