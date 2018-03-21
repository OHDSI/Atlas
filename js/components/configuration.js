define(['knockout', 'text!./configuration.html', 'appConfig', 'webapi/AuthAPI', 'atlas-state', 'access-denied'], function (ko, view, config, authApi, sharedState) {
	function configuration(params) {
		var self = this;
		self.config = config;
		self.api = config.api;
		self.sharedState = sharedState;

		self.isAuthenticated = authApi.isAuthenticated;
		self.hasAccess = ko.pureComputed(function () {
			return (config.userAuthenticationEnabled && self.isAuthenticated() && authApi.isPermittedEditConfiguration()) || !config.userAuthenticationEnabled;
		});
		self.canReadRoles = ko.pureComputed(function () {
			return self.isAuthenticated() && authApi.isPermittedReadRoles();
		})
		self.clearLocalStorageCache = function () {
			localStorage.clear();
			alert("Local Storage has been cleared.  Please refresh the page to reload configuration information.")
		}
	}


	var component = {
		viewModel: configuration,
		template: view
	};

	ko.components.register('ohdsi-configuration', component);
	return component;
});
