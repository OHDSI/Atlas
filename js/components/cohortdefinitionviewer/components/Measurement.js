define(['knockout','components/cohortbuilder/options','components/cohortbuilder/utils', 'text!./MeasurementTemplate.html'
], function (ko, options, utils, template) {

	function MeasurementViewModel(params) {
		var self = this;

		self.expression = ko.utils.unwrapObservable(params.expression);
		self.Criteria = params.criteria.Measurement;
		self.options = options;
	
    self.indexMessage = ko.pureComputed(() => {
      var conceptSetName = utils.getConceptSetName(
        self.Criteria.CodesetId,
        self.expression.ConceptSets,
        ""
      );
      return `${conceptSetName}.`;
    });
	
	}

	// return compoonent definition
	return {
		viewModel: MeasurementViewModel,
		template: template
	};
});