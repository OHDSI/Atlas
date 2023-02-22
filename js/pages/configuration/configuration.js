define([
  'knockout',
  'text!./configuration.html',
  'pages/Page',
  'utils/AutoBind',
  'utils/CommonUtils',
  'appConfig',
  'services/AuthAPI',
  'services/SourceAPI',
  'atlas-state',
  'const',
  'services/JobDetailsService',
  'services/Poll',
  'services/job/jobDetail',
  'services/CacheAPI',
  'less!./configuration.less',
  'components/heading'
], function (
  ko,
  view,
  Page,
  AutoBind,
  commonUtils,
  config,
  authApi,
  sourceApi,
  sharedState,
  constants,
  jobDetailsService,
  {PollService},
  jobDetail,
  cacheApi,
) {
	class Configuration extends AutoBind(Page) {
    constructor(params) {
      super(params);
      this.config = config;
      this.api = config.api;
      this.loading = ko.observable(false);
      this.sharedState = sharedState;
      this.isInProgress = ko.observable(false);
      this.jobListing = sharedState.jobListing;
      this.sourceJobs = new Map();
      this.sources = sharedState.sources;

      this.priorityOptions = [
        {id: 'session', name: ko.i18n('configuration.priorityOptions.session', 'Current Session')},
        {id: 'application', name: ko.i18n('configuration.priorityOptions.application', 'Whole Application')},
      ];

      this.isAuthenticated = authApi.isAuthenticated;
      this.initializationCompleted = ko.pureComputed(() => sharedState.appInitializationStatus() === constants.applicationStatuses.running ||
          sharedState.appInitializationStatus() === constants.applicationStatuses.noSourcesAvailable);
      this.hasSourceAccess = authApi.hasSourceAccess;
      this.hasPageAccess = ko.pureComputed(() => {
        return (config.userAuthenticationEnabled && this.isAuthenticated() && authApi.isPermittedEditConfiguration()) || !config.userAuthenticationEnabled;
      });
      this.canReadRoles = ko.pureComputed(() => {
        return this.isAuthenticated() && authApi.isPermittedReadRoles();
      });
      this.canCreateSource = ko.pureComputed(() => {
        if (!config.userAuthenticationEnabled) {
          return false;
        } else {
          return (config.userAuthenticationEnabled && this.isAuthenticated() && authApi.isPermittedCreateSource());
        }
      });
      this.canChangePriority = ko.pureComputed(() => {
        if (!config.userAuthenticationEnabled) {
          return false;
        } else {
          return (config.userAuthenticationEnabled && this.isAuthenticated() && authApi.isPermittedEditSourcePriority())
        }
      });

      this.canImport = ko.pureComputed(() => this.isAuthenticated() && authApi.isPermittedImportUsers());
      this.canManageTags = ko.pureComputed(() => this.isAuthenticated() && authApi.isPermittedTagsManagement());
      this.canClearServerCache = ko.pureComputed(() => {
        return config.userAuthenticationEnabled && this.isAuthenticated() && authApi.isPermittedClearServerCache()
      });

      this.intervalId = PollService.add({
        callback: () => this.checkJobs(),
        interval: config.pollInterval
      });
    }

    dispose() {
      PollService.stop(this.intervalId);
    }

    getSource(job) {
      return this.sourceJobs.get(job.executionId);
    }

    async checkJobs() {
      const notifications = await jobDetailsService.listRefreshCacheJobs();
      const jobs = notifications.data.map(n => {
          const job = new jobDetail();
          job.status(n.status);
          job.executionId = n.executionId;
          return job;
      });

      jobs.forEach(job => {
        let source = this.getSource(job);
        if (source && (job.isComplete() || job.isFailed())) {
          this.sourceJobs.delete(job.executionId);
          source.refreshState(job.isComplete() ? sourceApi.buttonCheckState.success : sourceApi.buttonCheckState.failed);
        }
      });
    }

    async onPageCreated() {
      this.loading(true);
      await sourceApi.initSourcesConfig();
      super.onPageCreated();
      this.loading(false);
    }

    canReadSource(source) {
			if (!config.userAuthenticationEnabled) {
				return false;
			} else {
				return (config.userAuthenticationEnabled && this.isAuthenticated() && authApi.isPermittedReadSource(source.sourceKey));
			}
    }

		canCheckConnection(source) {
			if (!config.userAuthenticationEnabled) {
				return false;
			} else {
				return (config.userAuthenticationEnabled && this.isAuthenticated() && authApi.isPermittedCheckSourceConnection(source.sourceKey));
			}
    }

    canRefreshSourceCache(source) {
      if (!config.userAuthenticationEnabled) {
        return false;
      } else {
        return (config.userAuthenticationEnabled && this.isAuthenticated() && authApi.hasSourceAccess(source.sourceKey) && source.hasResults
            && (source.hasVocabulary || source.hasCDM));
      }
    }

		clearLocalStorageCache() {
			localStorage.clear();

			alert(ko.unwrap(ko.i18n('configuration.alerts.clearLocalCache', 'Local Storage has been cleared.  Please refresh the page to reload configuration information.')))
		};

		clearServerCache() {
      if (confirm(ko.unwrap(ko.i18n('configuration.confirms.clearServerCache', 'Are you sure you want to clear the server cache?')))) {
        cacheApi.clearCache().then(() => {

          alert(ko.unwrap(ko.i18n('configuration.alerts.clearServerCache', 'Server cache has been cleared.')));
        });
      }
    };

		newSource() {
      commonUtils.routeTo('/source/0');
    };

		selectSource(source) {
			document.location = "#/source/" + source.sourceId;
		};

    async updateSourceDaimonPriority(sourceKey, daimonType) {
      if (sharedState.priorityScope() !== 'application') {
        return;
      }
      this.isInProgress(true);
      try {
        await sourceApi.updateSourceDaimonPriority(sourceKey, daimonType);
        await sourceApi.initSourcesConfig();
      } catch(err) {
        alert(ko.unwrap(ko.i18n('configuration.alerts.failUpdatePrioritySourceDaimon', 'Failed to update priority source daimon')));

      }
      this.isInProgress(false);
    }

    updateVocabPriority() {
      var newVocabUrl = sharedState.vocabularyUrl();
      var selectedSource = sharedState.sources().find((item) => { return item.vocabularyUrl === newVocabUrl; });
      sharedState.priorityScope() === 'application' && sharedState.defaultVocabularyUrl(newVocabUrl);
      this.updateSourceDaimonPriority(selectedSource.sourceKey, 'Vocabulary');
      return true;
    };

    updateEvidencePriority() {
      var newEvidenceUrl = sharedState.evidenceUrl();
      var selectedSource = sharedState.sources().find((item) => { return item.evidenceUrl === newEvidenceUrl; });
      sharedState.priorityScope() === 'application' && sharedState.defaultEvidenceUrl(newEvidenceUrl);
      this.updateSourceDaimonPriority(selectedSource.sourceKey, 'CEM');
      return true;
    };

    updateResultsPriority() {
      var newResultsUrl = sharedState.resultsUrl();
      var selectedSource = sharedState.sources().find((item) => { return item.resultsUrl === newResultsUrl; });
      sharedState.priorityScope() === 'application' && sharedState.defaultResultsUrl(newResultsUrl);
      this.updateSourceDaimonPriority(selectedSource.sourceKey, 'Results');
      return true;
    };

    checkSourceConnection(source) {
      sourceApi.checkSourceConnection(source.sourceKey)
        .then( ({ data }) =>
          source.connectionCheck(data.sourceId === undefined ?
            sourceApi.buttonCheckState.failed : sourceApi.buttonCheckState.success))
        .catch(() => {source.connectionCheck(sourceApi.buttonCheckState.failed);});
      source.connectionCheck(sourceApi.buttonCheckState.checking);
    };

    async refreshSourceCache(source) {
      try {
        source.refreshState(sourceApi.buttonCheckState.checking);
        const { data } = await sourceApi.refreshSourceCache(source.sourceKey);
        if(data.executionId === undefined) {
          source.refreshState(sourceApi.buttonCheckState.failed);
        } else {
          jobDetailsService.createJob(data);
          this.sourceJobs.set(data.executionId, source);
          source.refreshState(sourceApi.buttonCheckState.checking);
        }
      } catch (e) {
        source.refreshState(sourceApi.buttonCheckState.failed);
      }
    }

    getRefreshCacheButtonStyles(source) {
      return this.getButtonStyles(source.refreshState())
    };

    getCheckButtonStyles(source) {
      return this.getButtonStyles(source.connectionCheck());
    }

    getButtonStyles(sourceState) {
      let iconClass = 'fa-caret-right';
      let buttonClass = 'btn-primary';
      switch(sourceState) {
        case sourceApi.buttonCheckState.success:
          buttonClass = 'btn-success';
          iconClass = 'fa-check-square';
          break;
        case sourceApi.buttonCheckState.failed:
          buttonClass = 'btn-danger';
          iconClass = 'fa-exclamation-circle';
          break;
        case sourceApi.buttonCheckState.checking:
          buttonClass = 'btn-warning';
          iconClass = 'fa-circle-notch fa-spin';
          break;
      }
      return {
        iconClass,
        buttonClass,
      }
    }
  }

  return commonUtils.build('ohdsi-configuration', Configuration, view);
});
