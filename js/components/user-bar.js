define([
	'knockout',
	'text!./user-bar.html',
	'appConfig',
	'atlas-state',
	'providers/Component',
	'utils/CommonUtils',
	'webapi/AuthAPI',
	'services/http',
], function (ko,
	view,
	appConfig,
	state,
	Component,
	commonUtils,
	authApi,
	httpService,
) {
	class UserBar extends Component {
		constructor(params) {
			super(params);
			var endpoint = appConfig.api.url + 'notifications';
			this.model = params.model;
			this.appConfig = appConfig;
			this.token = authApi.token;
			this.tokenExpired = authApi.tokenExpired;
			this.authLogin = authApi.subject;
			this.pollInterval = null;
			this.isLoggedIn = ko.computed(() => {
				return authApi.isAuthenticated();
			});
			this.loading = params.model.loading;

			this.showJobModal = ko.observable(false);
			this.jobListing = state.jobListing;

			this.jobNotificationsPending = ko.computed(() => {
				var unviewedNotificationCount = this.jobListing().filter(j => {
					return !j.viewed();
				}).length;
				return unviewedNotificationCount;
			});

			this.clearJobNotificationsPending = this.clearJobNotificationsPending.bind(this);

			this.updateJobStatus = this.updateJobStatus.bind(this);
			this.startPolling = () => {
				this.pollInterval = setInterval(() => this.updateJobStatus(endpoint), appConfig.pollInterval);
			};

			this.stopPolling = () => {
				clearInterval(this.pollInterval);
			};

			if (!appConfig.userAuthenticationEnabled) {
				this.startPolling();
			}
			this.isLoggedIn.subscribe((isLoggedIn) => {
				if (isLoggedIn) {
					this.startPolling();
					this.updateJobStatus(endpoint)
				} else {
					this.stopPolling();
				}
			});
			if (this.isLoggedIn) {
				this.startPolling();
				this.updateJobStatus(endpoint)
			}


		}

		getExisting(n) {
			for (const job of this.jobListing()) {
				if (job.executionId == n.executionId) {
					return job;
				}
			}
			return null;
		}

		updateJobStatus(endpoint) {
			httpService.doGet(endpoint)
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
								viewed: ko.observable(false),
								url: this.getJobURL(n),
								executionUniqueId: ko.pureComputed(function () {
									return job.type + "-" + job.executionId;
								})
							};
							this.jobListing.queue(job);
							this.jobListing.valueHasMutated();

						}
					});
				});
		};

		getJobURL(n) {
			switch (n.jobInstance.name) {
				case "generateCohort":
					return 'cohortdefinition/' + n.jobParameters.cohort_definition_id + '/generation';
				case 'irAnalysis':
					return 'iranalysis/' + n.jobParameters.analysis_id + '/generation';
				case 'negativeControlsAnalysisJob':
					return 'conceptset/' + n.jobParameters.concept_set_id + '/evidence';
				case 'generateCohortCharacterization':
					return 'cc/characterizations' + n.jobParameters.cohort_characterization_id;
				case "cohortAnalysisJob":
					return 'cohortdefinition/' + n.jobParameters.cohortDefinitionIds + '/report?sourceKey=' + n.jobParameters.sourceKey;
				case 'executionEngine':
					switch (n.jobParameters.scriptType) {
						case "CCA":
							return 'estimation/' + n.jobParameters.cohortId;
						case 'PLP':
							return 'plp/' + n.jobParameters.cohortId;
					}
			}
			return null;
		}

		clearJobNotifications() {
			this.jobListing.removeAll();
		}

		clearJobNotificationsPending() {
			this.jobListing().forEach(j => {
				j.viewed(true);
			});
			this.jobListing.valueHasMutated();
		}

		jobNameClick(j) {
			$('#jobModal').modal('hide');
			window.location = '#/' + j.url;
		}
	}

	return commonUtils.build('user-bar', UserBar, view);
});
