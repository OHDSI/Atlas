define([
    'knockout',
    'text!./user-bar.html',
    'appConfig',
    'atlas-state',
    'providers/Component',
    'utils/CommonUtils',
    'webapi/AuthAPI',
    'less!./user-bar.less'
], function (ko,
             view,
             appConfig,
             state,
             Component,
             commonUtils,
             authApi) {
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

            this.startPolling = () => {
                this.pollInterval = setInterval(() => this.updateJobStatus(endpoint), appConfig.pollInterval);
            }

            this.stopPolling = () => {
                clearInterval(this.pollInterval);
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

            this.showJobModal = ko.observable(false);
            this.jobListing = state.jobListing;

            this.jobNotificationsPending = ko.computed(() => {
                var unviewedNotificationCount = this.jobListing().filter(j => {
                    return !j.viewed();
                }).length;
                return unviewedNotificationCount;
            });

            this.updateJobStatus = this.updateJobStatus.bind(this);
            this.clearJobNotificationsPending = this.clearJobNotificationsPending.bind(this);

            if (!appConfig.userAuthenticationEnabled) {
                this.startPolling();
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
            $.ajax(endpoint, {
                success: (notifications) => {
                    notifications.forEach(n => {
                        let job = this.getExisting(n);
                        if (job) {
                            if (job.status() !== n.status) {
                                job.status(n.status);
                                job.viewed(false);
                                this.jobListing.valueHasMutated();
                            }
                        } else {
                            job = {};
                            job.type = n.jobInstance.name;
                            job.name = n.jobParameters.jobName;
                            job.status = ko.observable(n.status);
                            job.executionId = n.executionId;
                            job.viewed = ko.observable(false);
                            job.executionUniqueId = ko.pureComputed(function () {
                                return job.type + "-" + job.executionId;
                            });
                            job.url = this.getJobURL(n);
                            this.jobListing.queue(job);
                            this.jobListing.valueHasMutated();

                        }
                    });
                }
            });
        };

        getJobURL(n) {
            switch (n.jobInstance.name) {
                case "generateCohort":
                    return 'cohortdefinition/' + n.jobParameters.cohort_definition_id + '/generation';
                case "cca":
                    return 'estimation/' + n.jobParameters.cohortId;
                case 'PLP':
                    return 'plp/' + n.jobParameters.cohortId;
                case 'ir-analysis':
                    return 'iranalysis/' +n.jobParameters.analysis_id + '/generation';
                case 'negative-controls':
                    return 'conceptset/' + n.jobParameters.concept_set_id + '/evidence';
                case 'generateCohortCharacterization':
                    return 'cc/characterizations' + n.jobParameters.cohort_characterization_id;
                case "":
                    return 'cohortdefinition/' + n.jobParameters.cohortDefinitionIds + '/reporting?sourceKey=' + n.jobParameters.sourceKey;
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
