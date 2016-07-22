define(['knockout','text!./ConceptListTemplate.html', 'conceptpicker/InputTypes/Concept'], function (ko, template, Concept) {

	function CocneptListViewModel(params) {
		var self = this;
		self.ConceptList = ko.utils.unwrapObservable(params.$raw.ConceptList);
		self.PickerParams = params.PickerParams;
		
		self.ConceptListNames = ko.pureComputed(function () {
			return ko.utils.unwrapObservable(self.ConceptList).map(function(item) { return item.CONCEPT_NAME }).join(', ');
		});
	}
	
	// return compoonent definition
	return {
		viewModel: CocneptListViewModel,
		template: template
	};
});