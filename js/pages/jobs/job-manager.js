define([
	'knockout',
	'text!./job-manager.html',
	'providers/Page',
	'providers/AutoBind',
	'utils/CommonUtils',
	'services/JobsService',
	'appConfig',
	'utils/MomentUtils',
	'webapi/AuthAPI',
	'databindings',
	'components/ac-access-denied',
	'components/heading',
],
	function (
		ko,
		view,
		Page,
		AutoBind,
		commonUtils,
		jobsService,
		config,
		momentUtils,
		authApi
	) {
	class JobManager extends AutoBind(Page) {
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

		async updateJobs() {
			this.model.jobs([]);

			try {
				const jobs = await jobsService.find();
				this.model.jobs(jobs.content.map((job) => {
					const startDate = new Date(job.startDate);
					job.startDate = momentUtils.formatDateTime(startDate);

					const endDate = new Date(job.endDate);
					job.endDate = momentUtils.formatDateTime(endDate);

					if (job.jobParameters.jobName == undefined) {
						job.jobParameters.jobName = 'n/a';
					}
					return job;
				}));
			} catch(er) {
				console.error(er);
			}
		}

	}

	return commonUtils.build('job-manager', JobManager, view);
});
