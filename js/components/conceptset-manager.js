define(['knockout', 'text!./conceptset-manager.html', 'knockout.dataTables.binding'], function (ko, view) {
	function conceptsetManager(params) {
		var self = this;
		self.model = params.model;
	}

	var component = {
		viewModel: conceptsetManager,
		template: view
	};

	ko.components.register('conceptset-manager', component);
	return component;
});
