define(['knockout', './ConceptSetItem'], function (ko, ConceptSetItem) {

	function ConceptSet(data) {
		var self = this;
		data = data || {};

		self.id = data.id;
		self.name = ko.observable(data.name || "Unnamed Concept Set");
		self.expression = {
			items: ko.observableArray(data.expression && data.expression.items && 
																data.expression.items.filter(function (item) { 
																	return item.concept != null; 
																}).map(function (item) { 
																	return new ConceptSetItem(item); 
																}))
		}
	}

	return ConceptSet;
});