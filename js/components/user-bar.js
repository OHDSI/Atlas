define(['knockout', 'text!./user-bar.html', 'appConfig', 'atlas-state'], function (ko, view, appConfig, state) {
	function userBar(params) {
		var self = this;

		self.updateJobStatus = function () {
			if (self.jobListing().length > 0) {
				self.jobListing().forEach(d => {
					$.ajax(d.progressUrl, {
						context: d,
						success: function (progressData) {
							var job = self.jobListing().find(j => j.executionId == d.executionId);
							if (job.progress() != progressData.length) {
								job.progress(progressData[d.progressValue]);
								job.viewed(false);
								self.jobListing.valueHasMutated();
							}
						}
					});
					$.ajax(d.statusUrl, {
						context: d,
						success: function (statusData) {
							var job = self.jobListing().find(j => j.executionId == d.executionId);
							if (job.status() != statusData[d.statusValue]) {
								job.status(statusData[d.statusValue]);
								job.viewed(false);
								self.jobListing.valueHasMutated();
							}
						}
					});
				});
			}
		};

		self.calculateProgress = function (j) {
			return (j.progress() / j.progressMax).toFixed(2) * 100 + '%';
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

		self.appConfig = appConfig;
	}

	var component = {
		viewModel: userBar,
		template: view
	};

	ko.components.register('user-bar', component);
	return component;
});
