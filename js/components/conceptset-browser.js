define(['knockout', 'text!./conceptset-browser.html', 'bootstrap', 'circe'], function (ko, view) {
	function conceptsetBrowser(params) {
		var self = this;
		self.model = params.model;

		self.onRespositoryConceptSetSelected = function (conceptSet) {
			window.location.href = "#/conceptset/" + conceptSet.id + '/details';
		}
        
        self.onConceptSetBrowserAction = function (result) {
            // Inspect the result to see what type of action was taken. For now
            // we're handling the 'add' action
            if (result.action == 'add') {
                self.newConceptSet();
            }
        }

		self.newConceptSet = function () {
			if (pageModel.currentConceptSet() == undefined) {
				pageModel.currentConceptSetSource('repository');
				document.location = '#/conceptset/0/details';
			}
		}        
	}

	var component = {
		viewModel: conceptsetBrowser,
		template: view
	};

	ko.components.register('conceptset-browser', component);
	return component;
});