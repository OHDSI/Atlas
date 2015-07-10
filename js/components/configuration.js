define(['knockout', 'text!./concept.html'], function (ko, view) {
	function configuration(params) {
		var self = this;
		self.services = params.services();
	}

	var component = {
		viewModel: configuration,
		template: view
	};

	ko.components.register('ohdsi-configuration', component);
	return component;
});
