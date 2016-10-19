define(['knockout', 'text!./job-manager.html', 'appConfig', 'knockout.dataTables.binding', 'access-denied'], function (ko, view, config) {
	function jobManager(params) {
		var self = this;

		var authApi = params.model.authApi;
		self.model = params.model;
		self.updateJobs = function () {
			self.model.jobs([]);

			$.ajax({
				url: config.services[0].url + 'job/execution?comprehensivePage=true',
				method: 'GET',
				headers: {
					Authorization: authApi.getAuthorizationHeader()
				},
				contentType: 'application/json',
				success: function (jobs) {
					for (var j = 0; j < jobs.content.length; j++) {
						var startDate = new Date(jobs.content[j].startDate);
						jobs.content[j].startDate = startDate.toLocaleDateString() + ' ' + startDate.toLocaleTimeString();

						var endDate = new Date(jobs.content[j].endDate);
						jobs.content[j].endDate = endDate.toLocaleDateString() + ' ' + endDate.toLocaleTimeString();

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
			return self.isAuthenticated() && authApi.isPermittedReadJobs();
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
