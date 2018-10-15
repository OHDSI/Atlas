define([
	'knockout',
	'text!./job-view-edit.html',
	'providers/AutoBind',
	'providers/Page',
	'utils/CommonUtils',
	'assets/ohdsi.util',
	'./services/JobService',
	'services/User',
	'./const',
	'moment',
	'less!./job-view-edit.less',
	'./components/weekdays',
], function(
	ko,
	view,
	AutoBind,
	Page,
	commonUtils,
	ohdsiUtil,
	jobService,
	userService,
	Const,
	moment,
){

	const EMPTY_JOB = {
		enabled: true,
		providerType: Const.PROVIDERS.ACTIVE_DIRECTORY,
		startDate: moment().add(1, 'hours').toDate(),
		frequency: 'ONCE',
		recurringTimes: 1,
		weekDays: [],
	};

	class JobViewEdit extends AutoBind(Page) {

		constructor(params) {
			super(params);

			this.jobId = ko.observable();
			this.loading = ko.observable();
			this.job = ko.observable({});
			this.jobDirtyFlag = ko.observable({ isDirty: () => false });
			this.providers = ko.observableArray();
			this.isSavePermitted = ko.computed(() => true);
			this.isDeletePermitted = ko.computed(() => true);
			this.executionOptions = Const.JobExecutionOptions;
			this.jobEnds = ko.observable("never");
			this.loadProviders();
			this.startDate = ko.observable(moment().add(1, 'hours').toDate());
			this.weekdays = ko.observableArray();
			this.moment = moment;
			this.setupJob(EMPTY_JOB);
		}

		onRouterParamsChanged({ jobId }) {
			if (jobId !== undefined) {
				this.jobId(parseInt(jobId));
				this.loadJob(this.jobId());
			}
		}

		setupJob(job) {
			this.job({
				...job,
				providerType: ko.observable(job.providerType),
				frequency: ko.observable(job.frequency),
				recurringUntilDate: ko.observable(job.recurringUntilDate),
				recurringTimes: ko.observable(job.recurringTimes),
			});
			this.startDate(job.startDate);
			this.weekdays.removeAll();
			job.weekDays.forEach(wd => this.weekdays.push(wd));
			this.jobDirtyFlag(new ohdsiUtil.dirtyFlag(this.job));
		}

		async loadJob(jobId) {

			if (jobId < 1) {
				this.setupJob(EMPTY_JOB);
			} else {
				this.loading(true);
				jobService.getJob(jobId)
					.then(res => this.setupJob(res))
					.finally(() => this.loading(false));
			}
		}

		saveJob() {
			const jobId = this.jobId();
			const job = ko.toJS(this.job());
			job.weekDays = this.weekdays();

			if (job.frequency === 'ONCE') {
				job.weekDays = [];
				job.recurringTimes = 1;
			}

			const tzOffset = new Date().getTimezoneOffset();
			job.startDate = moment(this.startDate()).utc(tzOffset).format();

			this.loading(true);
			if (jobId > 0) {
				jobService.updateJob(jobId, job)
					.then(res => this.setupJob(res))
					.finally(() => this.loading(false));
			} else {
				jobService.createJob(job)
					.then(res => commonUtils.routeTo('/import/job/' + res.id));
			}
		}

		loadProviders() {
			userService.getAuthenticationProviders()
				.then(res => this.providers(Const.AuthenticationProviders.filter(p => res[p.value + 'Url'])));
		}

		closeJob() {
			commonUtils.routeTo('/import');
		}

	}

	commonUtils.build('import-job-view-edit', JobViewEdit, view);

});