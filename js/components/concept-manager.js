define(['knockout', 'text!./concept-manager.html'], function (ko, view) {
	function conceptManager(params) {
		var self = this;
		self.model = params.model;
		self.currentConceptId = params.currentConceptId;

		self.currentConceptId.subscribe(function (conceptId) {
			self.model.loadConcept(conceptId);
		});
	}

	var component = {
		viewModel: conceptManager,
		template: view
	};

	ko.components.register('concept-manager', component);
	return component;
});
