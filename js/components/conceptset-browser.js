define(['knockout', 'text!./conceptset-browser.html', 'bootstrap', 'cohortconceptselector'], function (ko, view) {
	function conceptsetBrowser(params) {
		var self = this;
		self.model = params.model;
        
        self.onAtlasConceptSetSelectAction = function(result) {
            alert(result);
        }
        
        self.onRespositoryConceptSetSelected = function(conceptSet) {
            window.location.href = "#/conceptset/" + id + '/details';            
        }                
    }

	var component = {
		viewModel: conceptsetBrowser,
		template: view
	};

	ko.components.register('conceptset-browser', component);
	return component;
});
