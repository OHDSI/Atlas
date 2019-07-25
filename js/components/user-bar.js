define([
	'knockout',
	'text!./user-bar.html',
	'utils/AutoBind',
	'appConfig',
	'atlas-state',
	'components/Component',
	'utils/CommonUtils',
	'services/AuthAPI',
	'services/JobDetailsService',
	'services/MomentAPI',
	'lodash',
	'services/Poll',
	'less!./user-bar.less'
], function (ko,
			view,
			AutoBind,
			appConfig,
			state,
			Component,
			commonUtils,
			authApi,
			jobDetailsService,
			momentApi,
			lodash,
			PollService,
		) {
	class UserBar extends Component {
		constructor(params) {
			super(params);
			this.model = params.model;
			this.appConfig = appConfig;
			this.token = authApi.token;
			this.tokenExpired = authApi.tokenExpired;
			this.authLogin = authApi.subject;
			this.fullName = authApi.fullName;
			this.pollId = null;
			this.loading = params.model.loading;
			this.signInOpened = params.model.signInOpened;
			this.jobListing = state.jobListing;
			this.sortedJobListing = ko.computed(() => lodash.sortBy(this.jobListing(), el => -1 * el.executionId));
			this.lastViewedTime=null;
			this.permissionCheckWarningShown = false;

			this.jobModalOpened = ko.observable(false);
			this.jobModalOpened.subscribe(show => {
				if (authApi.isPermittedPostViewedNotifications()){
					if (!show) {
						jobDetailsService.setLastViewedTime(this.lastViewedTime);
						this.jobListing().forEach(j => {
							j.viewed(true);
						});
						this.jobListing.valueHasMutated();
					} else {
						this.lastViewedTime = Date.now()
					}
				} else {
					console.warn('There isn\'t permission to post viewed notification');
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
			if (authApi.isPermittedGetViewedNotifications()) {
				jobDetailsService.getLastViewedTime()
					.then(({data}) => {
						this.lastViewedTime = new Date(data);
						this.startPolling();
					})
					.catch(() => {
							console.warn('The server error occurred while getting viewed notifications');
					});
			} else {
				console.warn('There isn\'t permission to get viewed notifications');
			}
		}

		startPolling() {
			this.pollId = PollService.add({
				callback: () => this.updateJobStatus(),
				interval: appConfig.pollInterval,
			});
		};

		stopPolling() {
			PollService.stop(this.pollId);
		};

		getExisting(n) {
			return this.jobListing().find(j => j.executionId === n.executionId);
		}

		async updateJobStatus() {
			if (authApi.isPermittedGetAllNotifications()) {
				try {
					const notifications = await jobDetailsService.list();
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
								job.url = jobDetailsService.getJobURL(n);
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
				} catch (e) {
					console.warn('The server error occurred while getting all notifications');
				}
			} else if (!this.permissionCheckWarningShown) {
				console.warn('There isn\'t permission to get all notifications');
				this.permissionCheckWarningShown = true;
			}
		};

		jobNameClick(j) {
			this.jobModalOpened(false);
			window.location = '#/' + j.url;
		}
	}

	return commonUtils.build('user-bar', UserBar, view);
});
