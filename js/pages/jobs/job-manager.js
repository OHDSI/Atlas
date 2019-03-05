define([
	'knockout',
	'text!./job-manager.html',
	'pages/Page',
	'utils/AutoBind',
	'utils/CommonUtils',
	'services/Jobs',
	'appConfig',
	'services/MomentAPI',
	'services/AuthAPI',
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
		momentApi,
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
				{title: 'Start Date', data: 'startDate', type: 'datetime-formatted'},
				{title: 'End Date', data: 'endDate', type: 'datetime-formatted'}
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

			const jobs = await jobsService.getList();
			this.model.jobs(jobs.map((job) => {
				const startDate = new Date(job.startDate);
				job.startDate = momentApi.formatDateTime(startDate);
				if (job.endDate > startDate){
					const endDate = new Date(job.endDate);
					job.endDate = momentApi.formatDateTime(endDate);
				} else {
					job.endDate = '-';
				}
				if (job.jobParameters.jobName == undefined) {
					job.jobParameters.jobName = 'n/a';
				}
				return job;
			}));
		}

	}

	return commonUtils.build('job-manager', JobManager, view);
});
