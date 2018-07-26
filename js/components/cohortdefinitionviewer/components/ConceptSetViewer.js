define(['knockout','text!./ConceptSetViewerTemplate.html'], function (ko, template) {

	function ConceptSetViewer(params) {
		var self = this;
		self.conceptSet = params.conceptSet;
		
	}
	
	// return compoonent definition
	return {
		viewModel: ConceptSetViewer,
		template: template
	};
});