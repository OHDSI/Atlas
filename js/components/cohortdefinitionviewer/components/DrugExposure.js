define(['knockout','components/cohortbuilder/options','components/cohortbuilder/InputTypes/Range','components/cohortbuilder/InputTypes/Text', 'text!./DrugExposureTemplate.html'], function (ko, options, Range, Text, template) {

	function DrugExposureViewModel(params) {
		var self = this;

		self.expression = ko.utils.unwrapObservable(params.expression);
		self.Criteria = params.criteria.DrugExposure;
		self.options = options;

    self.indexMessage = ko.i18nformat(
      'components.conditionDrugExposure.indexDataText',
      'The index date refers to the drug exposure of <%= conceptSetName %>.',
      {
        conceptSetName: ko.pureComputed(() => utils.getConceptSetName(
          self.Criteria.CodesetId,
          self.expression.ConceptSets,
          ko.i18n('components.conditionDrugExposure.anyDrug', 'Any Drug')
        ))
      }
    );
		
	}

	// return compoonent definition
	return {
		viewModel: DrugExposureViewModel,
		template: template
	};
});