define(['knockout','text!./ConceptSetSelectorTemplate.html'
], function (ko, template) {
	
	function conceptsetSelector(params)
	{
		var self = this;
		self.conceptSetId = params.conceptSetId;
		self.defaultText = params.defaultText;
		self.conceptSets = params.conceptSets;

		self.conceptSetName = ko.computed(function() {
			var selectedConceptSet = self.conceptSets().filter(function(item) { return item.id == self.conceptSetId()});
			return (selectedConceptSet.length > 0 && selectedConceptSet[0].name()) || self.defaultText;
		});
	}
	
	var component = {
		viewModel: conceptsetSelector,
		template: template
	};

	ko.components.register('conceptset-selector', component);
	return component;
});