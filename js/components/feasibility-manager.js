define(['knockout', 'text!./feasibility-manager.html'], function (ko, view) {
	function feasibilityManager(params) {
		var self = this;
		self.feasibilityId = ko.observable();
		self.feasibilityId.subscribe(function(d) {
			document.location = '#/feasibility/' + d;
		});
	}

	var component = {
		viewModel: feasibilityManager,
		template: view
	};

	ko.components.register('feasibility-manager', component);
	return component;
});
