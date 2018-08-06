define([
	'knockout',
	'text!./user-bar.html',
	'appConfig',
	'atlas-state',
	'providers/Component',
	'utils/CommonUtils',
	'webapi/AuthAPI',
], function (
	ko,
	view,
	appConfig,
	state,
	Component,
	commonUtils,
	authApi
) {
	class UserBar extends Component {
		constructor(params) {
			super(params);			
			this.model = params.model;
			this.appConfig = appConfig;
			this.token = authApi.token;
			this.tokenExpired = authApi.tokenExpired;    
			this.authLogin = authApi.subject;		
			this.isLoggedIn = ko.computed(() => {
				return authApi.isAuthenticated();
			});

			this.isLoggedIn.subscribe((isLoggedIn) => {
				if (isLoggedIn) {
					this.pollInterval = setInterval(this.updateJobStatus, 60000);					
				} else {
					clearInterval(this.pollInterval);
				}
			});
			
			this.showJobModal = ko.observable(false);
			this.jobListing = state.jobListing;

			this.jobNotificationsPending = ko.computed(() => {
				var unviewedNotificationCount = this.jobListing().filter(j => {
					return !j.viewed();
				}).length;
				return unviewedNotificationCount;
			});

			this.updateJobStatus = this.updateJobStatus.bind(this);
			this.clearJobNotifications = this.clearJobNotifications.bind(this);
			this.clearJobNotificationsPending = this.clearJobNotificationsPending.bind(this);
		}

		updateJobStatus () {
			if (this.jobListing().length > 0) {
				this.jobListing().forEach(job => {
					if (job.isComplete() || job.isFailed()) {
						return;
					}
					
					if (job.progressUrl) {
						$.ajax(job.progressUrl, {
							context: job,
							success: (progressData) => {
								if (job.progress() != progressData.length) {
									job.progress(progressData[job.progressValue]);
									job.viewed(false);
									this.jobListing.valueHasMutated();
								}
							}
						});
					}

					if (job.statusUrl) {
						$.ajax(job.statusUrl, {
							context: job,
							success: (statusData) => {
								var currentStatus = job.getStatusFromResponse(statusData);
								//console.log(job.executionUniqueId() + "::" + currentStatus);
								if (job.status() != currentStatus) {
									job.status(currentStatus);
									job.viewed(false);
									this.jobListing.valueHasMutated();
								}
							}
						});
					}
				});
			}
		};

		calculateProgress (j) {
			return Math.round(j.progress() / j.progressMax * 100) + '%';
		}
		
		clearJobNotifications () {
			this.jobListing.removeAll();
		}

		clearJobNotificationsPending () {
			this.jobListing().forEach(j => {
				j.viewed(true);
			});
			this.jobListing.valueHasMutated();
		}
		
		jobNameClick (j) {
			$('#jobModal').modal('hide');
			window.location = '#/' + j.url;
		}
	}

	return commonUtils.build('user-bar', UserBar, view);
});
