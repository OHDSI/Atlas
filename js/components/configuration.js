define(['knockout', 'text!./configuration.html', 'appConfig'], function (ko, view, config) {
	function configuration(params) {
		var self = this;
		self.config = config;
		self.appInitializationFailed = params.model.appInitializationFailed;
		self.services = config.services;
	}

	var component = {
		viewModel: configuration,
		template: view
	};

	ko.components.register('ohdsi-configuration', component);
	return component;
});
