define(['knockout', 'conceptpicker/InputTypes/Concept'], function (ko, Concept) {

	function ConceptSetItem(data)
	{
		var self = this;
		
		self.concept = data.concept && new Concept(data.concept);
		self.isExcluded = ko.observable(data.isExcluded && data.isExcluded() || false);
		self.includeDescendants = ko.observable(data.includeDescendants && data.includeDescendants() || false);
		self.includeMapped = ko.observable(data.includeMapped && data.includeMapped() || false);
	}
	
	return ConceptSetItem;
});