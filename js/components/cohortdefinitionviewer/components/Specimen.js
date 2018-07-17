define(['knockout','components/cohortbuilder/options','components/cohortbuilder/InputTypes/Range','components/cohortbuilder/InputTypes/Text', 'text!./SpecimenTemplate.html'], function (ko, options, Range, Text, template) {

	function SpecimenViewModel(params) {
		var self = this;
		self.expression = ko.utils.unwrapObservable(params.expression);
		self.Criteria = params.criteria.Specimen;
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
		viewModel: SpecimenViewModel,
		template: template
	};
});