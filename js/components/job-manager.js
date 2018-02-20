define(['knockout', 'text!./job-manager.html', 'appConfig', 'moment', 'databindings', 'access-denied'], function (ko, view, config, moment) {
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
						if (moment(jobs.content[j].startDate).isValid()) {
							jobs.content[j].startDate = moment(jobs.content[j].startDate).format('YYYY-MM-DD hh:mm:ss a');
						}

						if (moment(jobs.content[j].endDate).isValid()) {							
							jobs.content[j].endDate = moment(jobs.content[j].endDate).format('YYYY-MM-DD hh:mm:ss a');
						}

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
