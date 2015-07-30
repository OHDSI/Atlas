define(['knockout', 'text!./job-manager.html', 'knockout.dataTables.binding'], function (ko, view) {
	function jobManager(params) {
		var self = this;
		self.model = params.model;
	}

	var component = {
		viewModel: jobManager,
		template: view
	};

	ko.components.register('job-manager', component);
	return component;
});
