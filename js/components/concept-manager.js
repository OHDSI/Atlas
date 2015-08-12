define(['knockout', 'text!./concept-manager.html'], function (ko, view) {
	function conceptManager(params) {
		var self = this;
		self.model = params.model;
		self.currentConceptId = params.currentConceptId;
	}

	var component = {
		viewModel: conceptManager,
		template: view
	};

	ko.components.register('concept-manager', component);
	return component;
});
