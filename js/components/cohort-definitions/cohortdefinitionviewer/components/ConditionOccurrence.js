define(['knockout', 'cohortbuilder/options', 'cohortbuilder/InputTypes/Range', 'cohortbuilder/InputTypes/Text', 'text!./ConditionOccurrenceTemplate.html'], function (ko, options, Range, Text, template) {

	function ConditionOccurrenceViewModel(params) {

		var self = this;
		self.expression = ko.utils.unwrapObservable(params.expression);
		self.Criteria = params.criteria.ConditionOccurrence;
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
		viewModel: ConditionOccurrenceViewModel,
		template: template
	};
});
