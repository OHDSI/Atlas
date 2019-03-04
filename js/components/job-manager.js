define([
	'knockout',
	'text!./job-manager.html',
	'appConfig',
	'webapi/MomentAPI',
	'webapi/AuthAPI',
	'databindings',
	'components/ac-access-denied',
],
	function (
		ko,
		view,
		config,
		momentApi,
		authApi,
	) {
	function jobManager(params) {
		var self = this;

		self.model = params.model;
		self.model.columns = ko.observableArray([
			{title: 'ExecutionId', data: 'executionId'},
			{title: 'Job Name', data: 'jobParameters.jobName'},
			{title: 'Status', data: 'status'},
			{title: 'Start Date', data: 'startDate', type: 'datetime-formatted'},
			{title: 'End Date', data: 'endDate', type: 'datetime-formatted'}
		]);
		if (config.userAuthenticationEnabled) {
			self.model.columns.splice(3, 0, {title: 'Author', data: 'jobParameters.jobAuthor', 'defaultContent': ''});
		}
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

		self.buttons = [
			'colvis',
			'copyHtml5',
			'csv'
		];

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
