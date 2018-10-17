define([
	'knockout',
	'text!./user-bar.html',
	'providers/AutoBind',
	'appConfig',
	'atlas-state',
	'providers/Component',
	'utils/CommonUtils',
	'webapi/AuthAPI',
	'services/JobDetailsService',
	'webapi/MomentAPI',
	'less!./user-bar.less',
], function (ko,
             view,
             AutoBind,
             appConfig,
             state,
             Component,
             commonUtils,
             authApi,
             jobDetailsService,
             momentApi) {
	class UserBar extends AutoBind(Component) {
		constructor(params) {
			super(params);
			this.model = params.model;
			this.appConfig = appConfig;
			this.token = authApi.token;
			this.tokenExpired = authApi.tokenExpired;
			this.authLogin = authApi.subject;
			this.pollInterval = null;
			this.loading = params.model.loading;
			this.jobListing = state.jobListing;
			this.lastViewedTime=null;

			this.showJobModal = ko.observable(false);
			this.showJobModal.subscribe(show => {
				if (!show) {
					jobDetailsService.setLastViewedTime(this.lastViewedTime);
					this.jobListing().forEach(j => {
						j.viewed(true);
					});
					this.jobListing.valueHasMutated();
				} else {
					this.lastViewedTime = Date.now()
				}
			});

			this.jobNotificationsPending = ko.computed(() => {
				var unviewedNotificationCount = this.jobListing().filter(j => {
					return !j.viewed();
				}).length;
				return unviewedNotificationCount;
			});

			this.isLoggedIn = ko.computed(() => {
				return authApi.isAuthenticated();
			});
			this.isLoggedIn.subscribe((isLoggedIn) => {
				if (isLoggedIn) {
					this.start();
				} else {
					this.stopPolling();
				}
			});
			if (this.isLoggedIn() || !appConfig.userAuthenticationEnabled) {
				this.start()
			}
		}

		start() {
			jobDetailsService.getLastViewedTime()
				.then(({data}) => {
					this.lastViewedTime = new Date(data);
					this.startPolling();
					this.updateJobStatus()
				})
		}

		startPolling() {
			this.pollInterval = setInterval(() => this.updateJobStatus(), appConfig.pollInterval);
		};

		stopPolling() {
			clearInterval(this.pollInterval);
		};

		getExisting(n) {
			return this.jobListing().find(j => j.executionId === n.executionId);
		}

		updateJobStatus() {
			jobDetailsService.list()
				.then(notifications => {
					notifications.data.forEach(n => {
						let job = this.getExisting(n);

						const endDate = (n.endDate ? n.endDate : Date.now());
						const duration = n.startDate ? momentApi.formatDuration(endDate - n.startDate) : '';
						const displayedEndDate = n.endDate ? momentApi.formatDateTime(new Date(n.endDate)) : '';

						if (job) {
							if (job.status() !== n.status) {
								job.status(n.status);
								job.viewed(false);
								job.duration = duration;
								job.endDate = displayedEndDate;
								this.jobListing.valueHasMutated();
							}
						} else {
							job = {
								type: n.jobInstance.name,
								name: n.jobParameters.jobName,
								status: ko.observable(n.status),
								executionId: n.executionId,
								viewed: ko.observable(n.startDate && this.lastViewedTime && (n.endDate || n.startDate) < this.lastViewedTime),
								url: jobDetailsService.getJobURL(n),
								executionUniqueId: ko.pureComputed(function () {
									return job.type + "-" + job.executionId;
								}),
								duration,
								endDate: displayedEndDate,
							};
							this.jobListing.push(job);
							this.jobListing.valueHasMutated();

						}
					});
				});
		};

		jobNameClick(j) {
			this.showJobModal(false);
			window.location = '#/' + j.url;
		}
	}

	return commonUtils.build('user-bar', UserBar, view);
});
