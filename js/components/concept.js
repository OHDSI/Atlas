define(['knockout', 'text!./concept.html'], function (ko, view) {
	function atlasConcept(params) {
		var self = this;
		self.model = params.model;
	}

	var component = {
		viewModel: atlasConcept,
		template: view
	};

	ko.components.register('atlas-concept', component);
	return component;
});
