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
], (
  ko,
  view,
  Page,
  AutoBind,
  commonUtils,
  jobsService,
  config,
  momentApi,
  authApi
) => {
  class JobManager extends AutoBind(Page) {
    constructor(params) {
      super(params);
      this.model = params.model;
      this.jobs = ko.observableArray([]);
      this.columns = ko.observableArray([
        { title: 'ExecutionId', data: 'executionId' },
        { title: 'Job Name', data: 'jobParameters.jobName' },
        { title: 'Status', data: 'status' },
        { title: 'Start Date', data: 'startDate', type: 'datetime-formatted' },
        { title: 'End Date', data: 'endDate', type: 'datetime-formatted' },
      ]);
      if (config.userAuthenticationEnabled) {
        this.columns.splice(3, 0, {
          title: 'Author',
          data: 'jobParameters.jobAuthor',
          defaultContent: '',
        });
      }
      this.isAuthenticated = authApi.isAuthenticated;
      this.canReadJobs = ko.pureComputed(() => authApi.isPermittedReadJobs());
      this.canReadJobs() && this.updateJobs();
    }

    async updateJobs() {
      try {
        this.jobs([]);
        const jobs = await jobsService.getList();
        this.jobs(
          jobs.map(job => {
            const { startDate = null, endDate = null } = job;
            job.startDate = startDate ? momentApi.formatDateTime(new Date(startDate)) : '-';
            job.endDate =
              endDate && endDate > startDate
                ? momentApi.formatDateTime(new Date(endDate))
                : '-';
            job.jobParameters.jobName == undefined && (job.jobParameters.jobName = 'n/a');
            return job;
          }),
        );
      } catch (e) {
        console.error(e);
      }
    }
  }

  return commonUtils.build('job-manager', JobManager, view);
});
