define(['knockout','components/cohortbuilder/options','components/cohortbuilder/InputTypes/Range', 'text!./DoseEraTemplate.html'], function (ko, options, Range, template) {

	function DoseEraViewModel(params) {
		
		var self = this;
		self.expression = ko.utils.unwrapObservable(params.expression);
		self.Criteria = params.criteria.DoseEra;
		self.options = options;

		self.getCodesetName = function(codesetId, defaultName) {
			if (codesetId != null)
			{
				var selectedConceptSet = self.expression.ConceptSets().filter(function (item) { return item.id == codesetId })[0];
				return ko.utils.unwrapObservable(selectedConceptSet.name);
			}
			else
				return defaultName;
		};
		
	}

	// return compoonent definition
	return {
		viewModel: DoseEraViewModel,
		template: template
	};
});