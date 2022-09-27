define(['knockout', './ConceptSetItem'], function (ko, ConceptSetItem) {

	function ConceptSet(data) {
		var self = this;
		data = data || {};

		self.id = data.id;
		self.name = ko.observable(data.name || ko.i18n('components.conceptSetBuilder.unnamedConceptSet', 'Unnamed Concept Set')());
		self.description = ko.observable(data.description || null);
		self.expression = {
			items: ko.observableArray(data.expression && data.expression.items && 
																data.expression.items.map(function (item) { 
																	return new ConceptSetItem(item); 
																}))
		}
	}

	return ConceptSet;
});