define([
	'knockout',
	'text!./user-bar.html',
	'appConfig',
	'atlas-state',
	'providers/Component',
	'utils/CommonUtils',
	'webapi/AuthAPI',
	'services/JobDetailsService',
], function (ko,
	view,
	appConfig,
	state,
	Component,
	commonUtils,
	authApi,
	jobDetailsService,
) {
	class UserBar extends Component {
		constructor(params) {
			super(params);
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
			this.jobListing = state.jobListing;

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

			this.clearJobNotificationsPending = this.clearJobNotificationsPending.bind(this);
			this.jobNameClick = this.jobNameClick.bind(this);

			this.updateJobStatus = this.updateJobStatus.bind(this);
			this.startPolling = () => {
				this.pollInterval = setInterval(() => this.updateJobStatus(), appConfig.pollInterval);
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
					this.updateJobStatus()
				} else {
					this.stopPolling();
				}
			});
			if (this.isLoggedIn) {
				this.startPolling();
				this.updateJobStatus()
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
