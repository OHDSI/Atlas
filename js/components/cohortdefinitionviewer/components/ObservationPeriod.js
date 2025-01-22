define(['knockout','components/cohortbuilder/options','components/cohortbuilder/utils', 'text!./ObservationPeriodTemplate.html'
], function (ko, options, utils, template) {

	function ObservationPeriodViewModel(params) {
		var self = this;

		self.expression = ko.utils.unwrapObservable(params.expression);
		self.Criteria = params.criteria.ObservationPeriod;
		self.options = options;
	}

	// return compoonent definition
	return {
		viewModel: ObservationPeriodViewModel,
		template: template
	};
});