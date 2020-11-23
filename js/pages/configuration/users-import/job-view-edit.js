define([
	'knockout',
	'text!./job-view-edit.html',
	'atlas-state',
	'utils/AutoBind',
	'pages/Page',
	'utils/CommonUtils',
	'assets/ohdsi.util',
	'./services/JobService',
	'services/User',
	'services/role',
	'./services/PermissionService',
	'./const',
	'moment',
	'less!./job-view-edit.less',
	'components/tabs',
	'./components/job-scheduler',
	'./components/role-group-mapping',
	'./components/job-history',
], function(
	ko,
	view,
	sharedState,
	AutoBind,
	Page,
	commonUtils,
	ohdsiUtil,
	jobService,
	userService,
	roleService,
	permissionService,
	Const,
	moment,
){

	const EMPTY_JOB = {
		enabled: true,
		preserveRoles: true,
		providerType: Const.PROVIDERS.ACTIVE_DIRECTORY,
		startDate: moment().add(1, 'hours').toDate(),
		frequency: 'ONCE',
		recurringTimes: 0,
		weekDays: [],
		roleGroupMapping: {
			provider: Const.PROVIDERS.ACTIVE_DIRECTORY,
			roleGroups: [],
		}
	};

	function toDate(date) {
		return date ? moment.utc(date).toDate() : null;
	}

	class JobViewEdit extends AutoBind(Page) {

		constructor(params) {
			super(params);

			this.roles = sharedState.roles;
			this.jobId = ko.observable();
			this.loading = ko.observable();
			this.job = ko.observable({});
			this.jobDirtyFlag = ko.observable({ isDirty: () => false });
			this.providers = ko.observableArray();
			this.selectedProvider = ko.observable();
			this.isSavePermitted = ko.computed(() => permissionService.isPermittedEdit(this.jobId()) && this.jobDirtyFlag().isDirty());
			this.isDeletePermitted = ko.computed(() => permissionService.isPermittedDelete(this.jobId()));
			this.jobEnds = ko.observable("never");
			this.loadProviders();
			this.weekdays = ko.observableArray();
			this.moment = moment;
			this.setupJob(EMPTY_JOB);
			this.selectedTabKey = ko.observable('scheduler');
			this.roleGroups = ko.observable([]);
			this.errorMessage = ko.observable();
			this.componentParams = {
				jobId: this.jobId,
				job: this.job,
				weekdays: this.weekdays,
				jobEnds: this.jobEnds,
				rolesMapping: this.roleGroups,
				provider: this.selectedProvider,
			};
		}

		onRouterParamsChanged({ jobId, section }) {
			if (jobId !== undefined) {
				this.jobId(parseInt(jobId));
				this.loadJob(this.jobId());
			}
			this.setupSection(section);
		}

		setupSection(section) {
			this.selectedTabKey(section || 'scheduler');
		}

		setupJob(job) {
			this.job({
				...job,
				enabled: ko.observable(job.enabled),
				preserveRoles: ko.observable(job.preserveRoles),
				providerType: this.selectedProvider,
				startDate: ko.observable(toDate(job.startDate)),
				frequency: ko.observable(job.frequency),
				recurringUntilDate: ko.observable(toDate(job.recurringUntilDate)),
				recurringTimes: ko.observable(job.recurringTimes),
				jobEnds: this.jobEnds,
				weekdays: this.weekdays,
				roleGroups: this.roleGroups,
			});
			roleService.updateRoles()
				.then(roles => {
					const mapping = this.roles().filter(role => !role.defaultImported).map(role => (
						{
							...role,
							groups: ko.observableArray(),
						}
					));
					const jobRoles = job.roleGroupMapping.roleGroups;
					mapping.forEach(roleMap => {
						const result = jobRoles.find(r => r.role.id === roleMap.id);
						roleMap.groups(result ? result.groups : []);
					});
					this.roleGroups(mapping);
					this.jobDirtyFlag().reset();
				});
			if (job.recurringUntilDate) {
				this.jobEnds(Const.JobEndOptions.ON);
			} else if (job.recurringTimes && job.recurringTimes > 0) {
				this.jobEnds(Const.JobEndOptions.AFTER);
			} else {
				this.jobEnds(Const.JobEndOptions.NEVER);
			}
			this.weekdays.removeAll();
			job.weekDays.forEach(wd => this.weekdays.push(wd));
			this.jobDirtyFlag(new ohdsiUtil.dirtyFlag(this.job()));
			this.jobId.valueHasMutated();
		}

		selectTab(index, { key }) {
			commonUtils.routeTo(`/import/job/${this.jobId()}/${key}`);
		}

		async loadJob(jobId) {

			if (jobId < 1) {
				this.setupJob(EMPTY_JOB);
			} else {
				this.loading(true);
				jobService.getJob(jobId)
					.then(res => {
						this.selectedProvider(res.providerType);
						this.setupJob(res);
					})
					.finally(() => this.loading(false));
			}
		}

		async saveJob() {
			const jobId = this.jobId();
			const job = ko.toJS(this.job());
			job.weekDays = this.weekdays();
			job.roleGroupMapping.roleGroups = jobService.mapRoleGroups(this.roleGroups());

			if (job.frequency === 'ONCE') {
				job.weekDays = [];
				job.recurringTimes = 1;
			}

			// const tzOffset = new Date().getTimezoneOffset();
			job.startDate = moment.utc(job.startDate).format();
			if (job.recurringUntilDate) {
				job.recurringUntilDate = moment.utc(job.recurringUntilDate).format();
			}

			switch(this.jobEnds()) {
				case Const.JobEndOptions.AFTER:
					job.recurringUntilDate = null;
					break;
				case Const.JobEndOptions.ON:
					job.recurringTimes = 0;
					break;
				default:
					job.recurringUntilDate = null;
					job.recurringTimes = 0;
					break;
			}

			this.loading(true);
			if (jobId > 0) {
				jobService.updateJob(jobId, job)
					.then(res => this.setupJob(res))
					.finally(() => this.loading(false));
			} else {
				jobService.createJob(job)
					.then(res => commonUtils.routeTo('/import/job/' + res.id))
					.catch(res => alert( (res && res.payload && res.payload.message) ? res.payload.message : 'There is only one job could be assigned to each Provider' ))
					.finally(() => this.loading(false));
			}
		}

		loadProviders() {
			userService.getAuthenticationProviders()
				.then(res => this.providers(Const.AuthenticationProviders.filter(p => res[p.value + 'Url'])));
		}

		closeJob() {
			if (this.jobDirtyFlag().isDirty() && !confirm("Your changes are not saved. Would you like to continue?")) {
				return;
			}
			this.jobDirtyFlag().reset();
			commonUtils.routeTo('/import');
		}

		deleteJob() {
			if (confirm('Are you sure?')) {
				this.loading(true);
				jobService.deleteJob(this.jobId())
					.then(() => {
						this.jobDirtyFlag().reset();
						this.closeJob();
					}).finally(() => this.loading(false));
			}
		}

	}

	commonUtils.build('import-job-view-edit', JobViewEdit, view);

});