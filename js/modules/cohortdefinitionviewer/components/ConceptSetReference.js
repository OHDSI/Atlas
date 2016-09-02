define(['knockout','text!./ConceptSetReferenceTemplate.html'], function (ko, template) {

	function conceptSetSorter(a,b)
	{
		var textA = a.name().toUpperCase();
		var textB = b.name().toUpperCase();
		return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
	}
	
	function ConceptSetReference(params) {
		var self = this;
		self.conceptSetId =params.conceptSetId;
		self.conceptSets = params.conceptSets;
		self.sortedConceptSets = self.conceptSets.extend({sorted: conceptSetSorter});
		self.defaultName = params.defaultName;
		
		self.referenceId = ko.pureComputed(function () {
			var calculatedRefId = "";
			var selectedConceptSet = self.conceptSets().filter(function(item) { return item.id == ko.utils.unwrapObservable(self.conceptSetId); })[0];
			if (selectedConceptSet)
			{
				calculatedRefId = (self.sortedConceptSets().indexOf(selectedConceptSet) + 1) + "";
			}
			return calculatedRefId;
		});
		
		self.codesetName = ko.pureComputed(function () {
			var selectedConceptSet = self.conceptSets().filter(function (item) { return item.id == ko.utils.unwrapObservable(self.conceptSetId)})[0];
			if (selectedConceptSet)
			{
				return ko.utils.unwrapObservable(selectedConceptSet.name);
			}
			else
				return self.defaultName;
		});
	}
	
	// return compoonent definition
	return {
		viewModel: ConceptSetReference,
		template: template
	};
});