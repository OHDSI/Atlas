define(['knockout', 'text!./job-manager.html', 'appConfig', 'webapi/MomentAPI', 'databindings', 'components/ac-access-denied'], function (ko, view, config, momentApi) {
	function jobManager(params) {
		var self = this;

		var authApi = params.model.authApi;
		self.model = params.model;
		self.updateJobs = function () {
			self.model.jobs([]);

			$.ajax({
				url: config.api.url + 'job/execution?comprehensivePage=true',
				method: 'GET',
				contentType: 'application/json',
				success: function (jobs) {
					for (var j = 0; j < jobs.content.length; j++) {
						var startDate = new Date(jobs.content[j].startDate);
						jobs.content[j].startDate = momentApi.formatDateTime(startDate);

						var endDate = new Date(jobs.content[j].endDate);
						jobs.content[j].endDate = momentApi.formatDateTime(endDate);

						if (jobs.content[j].jobParameters.jobName == undefined) {
							jobs.content[j].jobParameters.jobName = 'n/a';
						}
					}
					self.model.jobs(jobs.content);
				},
				error: authApi.handleAccessDenied
			});
		}

		self.isAuthenticated = authApi.isAuthenticated;
		self.canReadJobs = ko.pureComputed(function() {
			return (self.isAuthenticated() && authApi.isPermittedReadJobs()) || !config.userAuthenticationEnabled;
		});

		if (self.canReadJobs()) {
			self.updateJobs();
		}
	}

	var component = {
		viewModel: jobManager,
		template: view
	};

	ko.components.register('job-manager', component);
	return component;
});
