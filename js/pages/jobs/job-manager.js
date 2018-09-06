define([
	'knockout',
	'text!./job-manager.html',
	'providers/Component',
	'providers/AutoBind',
	'utils/CommonUtils',
	'./const',
	'services/http',
	'appConfig',
	'webapi/MomentAPI',
	'webapi/AuthAPI',
	'databindings',
	'components/ac-access-denied',
	'components/heading',
],
	function (
		ko,
		view,
		Component,
		AutoBind,
		commonUtils,
		constants,
		httpService,
		config,
		momentApi,
		authApi
	) {
	class JobManager extends AutoBind(Component) {
		constructor(params) {
			super(params);			
			this.model = params.model;
			this.model.columns = ko.observableArray([
				{title: 'ExecutionId', data: 'executionId'},
				{title: 'Job Name', data: 'jobParameters.jobName'},
				{title: 'Status', data: 'status'},
				{title: 'Start Date', data: 'startDate', type: 'date'},
				{title: 'End Date', data: 'endDate', type: 'date'}
			]);
			if (config.userAuthenticationEnabled) {
				this.model.columns.splice(3, 0, {title: 'Author', data: 'jobParameters.jobAuthor', 'defaultContent': ''});
			}
			this.isAuthenticated = authApi.isAuthenticated;
			this.canReadJobs = ko.pureComputed(() => {
				return authApi.isPermittedReadJobs();
			});

			if (this.canReadJobs()) {
				this.updateJobs();
			}
		}

		updateJobs() {
			this.model.jobs([]);

			httpService.doGet(constants.paths.jobs())
				.then(({ data: jobs }) => {
					for (var j = 0; j < jobs.content.length; j++) {
						var startDate = new Date(jobs.content[j].startDate);
						jobs.content[j].startDate = momentApi.formatDateTime(startDate);

						var endDate = new Date(jobs.content[j].endDate);
						jobs.content[j].endDate = momentApi.formatDateTime(endDate);

						if (jobs.content[j].jobParameters.jobName == undefined) {
							jobs.content[j].jobParameters.jobName = 'n/a';
						}
					}
					this.model.jobs(jobs.content);
				});
		}

	}

	return commonUtils.build('job-manager', JobManager, view);
});
