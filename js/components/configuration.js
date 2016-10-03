define(['knockout', 'text!./configuration.html', 'appConfig', 'webapi/AuthAPI', 'access-denied'], function (ko, view, config, authApi) {
	function configuration(params) {
		var self = this;
		self.config = config;
		self.enableRecordCounts = params.enableRecordCounts;
		self.services = config.services;

		self.isAuthenticated = authApi.isAuthenticated;
		self.hasAccess = ko.pureComputed(function () { return self.isAuthenticated() && authApi.isPermittedEditConfiguration(); });
		self.canReadRoles = ko.pureComputed(function () { return self.isAuthenticated() && authApi.isPermittedReadRoles(); })
	}

	var component = {
		viewModel: configuration,
		template: view
	};

	ko.components.register('ohdsi-configuration', component);
	return component;
});
