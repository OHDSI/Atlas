define(['knockout', 'text!./user-bar.html', 'appConfig', 'atlas-state'], function (ko, view, appConfig, state) {
	function userBar(params) {
		var self = this;
		var authApi = params.model.authApi;

		self.updateJobStatus = function () {
			if (self.jobListing().length > 0) {
				self.jobListing().forEach(job => {
					if (job.isComplete() || job.isFailed()) {
						return;
					}
					
					if (job.progressUrl) {
						$.ajax(job.progressUrl, {
							context: job,
							success: function (progressData) {
								if (job.progress() != progressData.length) {
									job.progress(progressData[job.progressValue]);
									job.viewed(false);
									self.jobListing.valueHasMutated();
								}
							}
						});
					}

					if (job.statusUrl) {
						$.ajax(job.statusUrl, {
							context: job,
							success: function (statusData) {
								var currentStatus = job.getStatusFromResponse(statusData);
								//console.log(job.executionUniqueId() + "::" + currentStatus);
								if (job.status() != currentStatus) {
									job.status(currentStatus);
									job.viewed(false);
									self.jobListing.valueHasMutated();
								}
							}
						});
					}
				});
			}
		};

		self.calculateProgress = function (j) {
			return Math.round(j.progress() / j.progressMax * 100) + '%';
		}

		setInterval(self.updateJobStatus, 60000);

		self.showJobModal = ko.observable(false);
		self.jobListing = state.jobListing;

		self.clearJobNotifications = function () {
			self.jobListing.removeAll();
		}

		self.clearJobNotificationsPending = function () {
			self.jobListing().forEach(j => {
				j.viewed(true);
			});
			self.jobListing.valueHasMutated();
		}

		self.jobNotificationsPending = ko.computed(function () {
			var unviewedNotificationCount = self.jobListing().filter(j => {
				return !j.viewed();
			}).length;
			return unviewedNotificationCount;
		});
		
		self.jobNameClick = function(j) {
			$('#jobModal').modal('hide');
			window.location = '#/' + j.url;
		}

		self.appConfig = appConfig;
		self.token = authApi.token;
		self.isLoggedIn = ko.computed(function () {
			if (!self.token()) return null;
			return authApi.isAuthenticated();
		});
	}

	var component = {
		viewModel: userBar,
		template: view
	};

	ko.components.register('user-bar', component);
	return component;
});
