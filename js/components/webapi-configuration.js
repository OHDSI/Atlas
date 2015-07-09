define(['knockout', 'text!./webapi-configuration.html'], function (ko, view) {
	function webapiConfiguration(params) {
		var self = this;

		self.setCurrentServiceUrl = function (service) {
			self.currentServiceUrl(service.url);
		}

		self.services = params.services;
		self.currentServiceUrl = params.currentServiceUrl;

		$.each(this.services, function (index, service) {
			$.ajax({
				url: service.url + 'vocabulary/info',
				method: 'GET',
				contentType: 'application/json',
				success: function (info) {
					service.version(info.version);
					service.dialect(info.dialect);
				},
				error: function (err) {
					service.version('unknown');
					service.dialect('unknown');
				}
			});
		});
	}

	var component = {
		viewModel: webapiConfiguration,
		template: view
	};

	ko.components.register('webapi-configuration', component);
	return component;
});
