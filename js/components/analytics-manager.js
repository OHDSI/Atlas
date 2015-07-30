define(['knockout', 'text!./analytics-manager.html', 'knockout.dataTables.binding'], function (ko, view) {
	function analyticsManager(params) {
		var self = this;
		self.model = params.model;
	}

	var component = {
		viewModel: analyticsManager,
		template: view
	};

	ko.components.register('analytics-manager', component);
	return component;
});
