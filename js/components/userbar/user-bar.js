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
	'less!./user-bar.less',
	'components/tabs',
	'components/userbar/tabs/user-bar-jobs',
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
			this.selectTab = this.selectTab.bind(this);
			this.userJobParams = {
				jobListing: ko.computed(() => lodash.sortBy(this.jobListing(), el => -1 * el.executionId)
					.filter( j => j.ownerType === constants.jobTypes.USER_JOB.ownerType)),
				jobNameClick: this.jobNameClick.bind(this),
			};
			this.allJobParams = {
				jobListing: ko.computed(() => lodash.sortBy(this.jobListing(), el => -1 * el.executionId)
					.filter( j => j.ownerType === constants.jobTypes.ALL_JOB.ownerType)),
			};
			this.tabs = [];
			this.selectedTabKey = ko.observable();
			if (this.appConfig.userAuthenticationEnabled) {
				this.tabs.push({
					title: ko.i18n('notifications.tabs.myJobs', 'My jobs'),
					key: constants.jobTypes.USER_JOB.title,
					componentName: 'user-bar-jobs',
					componentParams: this.userJobParams,
				});
				this.selectedTabKey(constants.jobTypes.USER_JOB.title);
				this.jobNotificationsPending = ko.computed(() => this.userJobParams.jobListing().filter(j => !j.viewed()).length);
			} else {
				this.selectedTabKey(constants.jobTypes.ALL_JOB.title);
				this.jobNotificationsPending = ko.computed(() => this.allJobParams.jobListing().filter(j => !j.viewed()).length);
				this.allJobParams.jobNameClick = this.jobNameClick.bind(this);
			}
			this.tabs.push({
				title: ko.i18n('notifications.tabs.allJobs', 'All jobs'),
				key: constants.jobTypes.ALL_JOB.title,
				componentName: 'user-bar-jobs',
				componentParams: this.allJobParams,
			});
			this.jobsCount = ko.computed(() => {
				if (this.selectedTabKey() === constants.jobTypes.USER_JOB.title) {
					return this.userJobParams.jobListing().length;
				}
				if (this.selectedTabKey() === constants.jobTypes.ALL_JOB.title) {
					return this.allJobParams.jobListing().length;
				}
				return 0;
			})
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
					return typeof this() === 'string' ? this() === 'true' : this(); 
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
							ownerType: n.ownerType,
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

		selectTab(tab) {
			switch (tab) {
				default:
				case 0:
					this.selectedTabKey(constants.jobTypes.USER_JOB.title);
					break;
				case 1:
					this.selectedTabKey(constants.jobTypes.ALL_JOB.title);
					break;
			}
		}
	}

	return commonUtils.build('user-bar', UserBar, view);
});
