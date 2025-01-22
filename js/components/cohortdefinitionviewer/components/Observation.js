define(['knockout', 'components/cohortbuilder/options', 'components/cohortbuilder/utils', 'text!./ObservationTemplate.html'
], function (ko, options, utils, template) {

	function ObservationViewModel(params) {
		var self = this;

		self.expression = ko.utils.unwrapObservable(params.expression);
		self.Criteria = params.criteria.Observation;
		self.options = options;

    self.indexMessage = ko.i18nformat(
      'components.conditionObservation.indexDataText',
      'The index date refers to the observation of <%= conceptSetName %>.',
      {
        conceptSetName: ko.pureComputed(() => utils.getConceptSetName(
          self.Criteria.CodesetId,
          self.expression.ConceptSets,
          ko.i18n('components.conditionObservation.anyObservation', 'Any Observation')
        ))
      }
    );
	}

	// return compoonent definition
	return {
		viewModel: ObservationViewModel,
		template: template
	};
});