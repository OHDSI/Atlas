define(['knockout','components/cohortbuilder/options','components/cohortbuilder/utils', 'text!./SpecimenTemplate.html'
], function (ko, options, utils, template) {

	function SpecimenViewModel(params) {
		var self = this;
		self.expression = ko.utils.unwrapObservable(params.expression);
		self.Criteria = params.criteria.Specimen;
		self.options = options;
		
    self.indexMessage = ko.i18nformat(
      'components.conditionSpecimen.indexDataText',
      'The index date refers to the specimen of <%= conceptSetName %>.',
      {
        conceptSetName: ko.pureComputed(() => utils.getConceptSetName(
          self.Criteria.CodesetId,
          self.expression.ConceptSets,
          ko.i18n('components.conditionSpecimen.anySpecimen', 'Any Specimen')
        ))
      }
    );
		
	}

	// return compoonent definition
	return {
		viewModel: SpecimenViewModel,
		template: template
	};
});