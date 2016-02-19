define(['knockout', 'text!./conceptset-browser.html', 'bootstrap', 'cohortconceptselector'], function (ko, view) {
	function conceptsetBrowser(params) {
		var self = this;
		self.model = params.model;

		self.onAtlasConceptSetSelectAction = function (result) {
			alert(result);
		}

		self.onRespositoryConceptSetSelected = function (conceptSet) {
			window.location.href = "#/conceptset/" + conceptSet.id + '/details';
		}

		self.newConceptSet = function () {
			if (pageModel.currentConceptSet() == undefined) {
				pageModel.currentConceptSet({
					name: 'New Concept Set',
					id: 0
				});
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