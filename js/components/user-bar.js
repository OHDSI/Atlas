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
	'const',
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
			{PollService},
			constants
		) {
	class UserBar extends Component {
		constructor(params) {
			super(params);
			this.appConfig = appConfig;
			this.token = authApi.token;
			this.tokenExpired = authApi.tokenExpired;
			this.authLogin = authApi.subject;
			this.fullName = authApi.fullName;
			this.pollId = null;
			this.loading = state.loading;
			this.signInOpened = authApi.signInOpened;
			this.jobListing = state.jobListing;
			this.sortedJobListing = ko.computed(() => lodash.sortBy(this.jobListing(), el => -1 * el.executionId));
			this.lastViewedTime=null;
			this.permissionCheckWarningShown = false;
			this.availableLocales = state.availableLocales;
			this.locale = state.locale;
			this.shouldUpdateJobStatus = true;
			this.jobListing.subscribe(() => {
				if (this.shouldUpdateJobStatus) {
					this.updateJobStatus();
				}
			});

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
						this.lastViewedTime = Date.now();
					}
				} else {
					console.warn('There isn\'t permission to post viewed notification');
				}
			});

			this.jobNotificationsPending = ko.computed(() => this.jobListing().filter(j => !j.viewed()).length);

			this.isLoggedIn = ko.computed(() => authApi.isAuthenticated());
			this.isLoggedIn.subscribe((isLoggedIn) => {
				if (isLoggedIn) {
					this.start();
				} else {
					this.stopPolling();
				}
			});
			if (this.isLoggedIn() || !appConfig.userAuthenticationEnabled) {
				this.start();
			}

			this.isRefreshing = ko.observable(false);

			this.hideCompleted = ko.computed({
				owner: ko.observable(localStorage.getItem("jobs-hide-statuses")),
				read: function() { 
					return this(); 
				},
				write: function( newValue ) {
					localStorage.setItem("jobs-hide-statuses", newValue);
					this( newValue );
				}
			});

			this.toggleCompletedFilter = () => {
				const value = this.hideCompleted();
				this.hideCompleted(!value);
				
				this.stopPolling();
				this.startPolling();
			};
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
		}

		stopPolling() {
			PollService.stop(this.pollId);
		}

		getExisting(n) {
			return this.jobListing().find(j => j.executionId === n.executionId);
		}

		async updateJobStatus() {
			if (authApi.isPermittedGetAllNotifications()) {
				try {
					this.isRefreshing(true);
					const hideStatuses = [];
					if (this.hideCompleted()) {
						hideStatuses.push(constants.generationStatuses.COMPLETED);
					}
					const notifications = await jobDetailsService.list(hideStatuses);
					const jobs = notifications.data.map(n => {
						const previousJob = this.getExisting(n);

						const endDate = (n.endDate ? n.endDate : Date.now());
						const duration = n.startDate ? momentApi.formatDuration(endDate - n.startDate) : '';
						const displayedEndDate = n.endDate ? momentApi.formatDateTime(new Date(n.endDate)) : '';

						const job = {
							type: n.jobInstance.name,
							name: n.jobParameters.jobName,
							status: n.status,
							executionId: n.executionId,
							viewed: ko.observable((previousJob && previousJob.viewed()) || (n.startDate && this.lastViewedTime && (n.endDate || n.startDate) < this.lastViewedTime)),
							url: jobDetailsService.getJobURL(n),
							executionUniqueId: ko.pureComputed(function () {
								return job.type + "-" + job.executionId;
							}),
							duration,
							endDate: displayedEndDate,
						};
						return job;
					});
					this.shouldUpdateJobStatus = false;
					this.jobListing(jobs);
					this.shouldUpdateJobStatus = true;
				} catch (e) {
					console.warn('The server error occurred while getting all notifications');
				} finally {
					this.isRefreshing(false);
				}
			} else if (!this.permissionCheckWarningShown) {
				console.warn('There isn\'t permission to get all notifications');
				this.permissionCheckWarningShown = true;
			}
		}

		jobNameClick(j) {
			this.jobModalOpened(false);
			window.location = '#/' + j.url;
		}
	}

	return commonUtils.build('user-bar', UserBar, view);
});
