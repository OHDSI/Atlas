define(['knockout','components/cohortbuilder/options', 'text!./DemographicCriteriaTemplate.html',
], function (ko, options, template) {

	function DemographicCriteriaViewModel(params) {

		var self = this;
		self.Criteria = params.criteria;
		self.expression = ko.utils.unwrapObservable(params.expression);
		self.options = options;
	}

	// return compoonent definition
	return {
		viewModel: DemographicCriteriaViewModel,
		template: template
	};
});