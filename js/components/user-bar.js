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
			this.jobsLoaded = false;

			this.showJobModal = ko.observable(false);
			this.showJobModal.subscribe(show => {
				if (!show) {
					this.jobListing().forEach(j => {
						j.viewed(true);
					});
					this.jobListing.valueHasMutated();
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
					this.startPolling();
					this.updateJobStatus()
				} else {
					this.stopPolling();
				}
			});
			if (this.isLoggedIn() || !appConfig.userAuthenticationEnabled) {
				this.startPolling();
				this.updateJobStatus()
			}
		}

		startPolling() {
			this.pollInterval = setInterval(() => this.updateJobStatus(), appConfig.pollInterval);
		};

		stopPolling() {
			clearInterval(this.pollInterval);
		};

		getExisting(n) {
			for (const job of this.jobListing()) {
				if (job.executionId == n.executionId) {
					return job;
				}
			}
			return null;
		}

		updateJobStatus() {
			jobDetailsService.list()
				.then(notifications => {
					notifications.data.forEach(n => {
						let job = this.getExisting(n);
						if (job) {
							if (job.status() !== n.status) {
								job.status(n.status);
								job.viewed(false);
								this.jobListing.valueHasMutated();
							}
						} else {
							job = {
								type: n.jobInstance.name,
								name: n.jobParameters.jobName,
								status: ko.observable(n.status),
								executionId: n.executionId,
								viewed: ko.observable(!this.jobsLoaded),
								url: jobDetailsService.getJobURL(n),
								executionUniqueId: ko.pureComputed(function () {
									return job.type + "-" + job.executionId;
								})
							};
							this.jobListing.push(job);
							this.jobListing.valueHasMutated();

						}
						let endDate = (n.endDate ? n.endDate : Date.now());
						job.duration = n.startDate ? momentApi.formatDuration(endDate - n.startDate) : '';
						job.endDate = n.endDate ? momentApi.formatDateTime(new Date(n.endDate)) : '';
					});
					this.jobsLoaded = true;
				});
		};

		clearJobNotificationsPending() {
			this.showJobModal(false);
		}

		jobNameClick(j) {
			this.showJobModal(false);
			window.location = '#/' + j.url;
		}
	}

	return commonUtils.build('user-bar', UserBar, view);
});
