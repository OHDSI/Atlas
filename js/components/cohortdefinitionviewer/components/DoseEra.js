define(['knockout', 'components/cohortbuilder/options', 'components/cohortbuilder/utils', 'text!./DoseEraTemplate.html'
], function (ko, options, utils, template) {

	function DoseEraViewModel(params) {
		
		var self = this;
		self.expression = ko.utils.unwrapObservable(params.expression);
		self.Criteria = params.criteria.DoseEra;
		self.options = options;

    self.indexMessage = ko.i18nformat(
      'components.conditionDose.indexDataText',
      'The index date refers to the dose era of <%= conceptSetName %>.',
      {
        conceptSetName: ko.pureComputed(() => utils.getConceptSetName(
          self.Criteria.CodesetId,
          self.expression.ConceptSets,
          ko.i18n('components.conditionDose.anyDoseEra', 'Any Dose Era')
        ))
      }
    );
		
	}

	// return compoonent definition
	return {
		viewModel: DoseEraViewModel,
		template: template
	};
});