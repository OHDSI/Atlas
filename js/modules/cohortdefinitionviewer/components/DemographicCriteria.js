define(['knockout', 'text!./DemographicCriteriaTemplate.html',
], function (ko, template) {

	function DemographicCriteriaViewModel(params) {

		var self = this;
		self.Criteria = params.criteria;
		
	}

	// return compoonent definition
	return {
		viewModel: DemographicCriteriaViewModel,
		template: template
	};
});