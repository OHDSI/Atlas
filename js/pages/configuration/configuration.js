define([
  'knockout',
  'text!./configuration.html',
  'providers/Page',
  'providers/AutoBind',
  'utils/CommonUtils',
  'appConfig',
  'webapi/AuthAPI',
  'webapi/SourceAPI',
  'atlas-state',
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
  sharedState
) {
	class Configuration extends AutoBind(Page) {
    constructor(params) {
      super(params);
      this.config = config;
      this.api = config.api;
      this.sharedState = sharedState;
      this.isInProgress = ko.observable(false);
      this.sources = sharedState.sources;
      this.priorityOptions = [
        {name: 'Current Session', id: 'session'},
        {name: 'Whole Application', id: 'application'},
      ];
  
      this.isAuthenticated = authApi.isAuthenticated;
      this.initializationCompleted = ko.pureComputed(() => sharedState.appInitializationStatus() === 'running' || sharedState.appInitializationStatus() === 'no-sources-available');
      this.hasAccess = ko.pureComputed(() => {
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
    
		clearLocalStorageCache() {
			localStorage.clear();
			alert("Local Storage has been cleared.  Please refresh the page to reload configuration information.")
		};

		newSource() {
			document.location = "#/source/new";
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
        sourceApi.initSourcesConfig();
      } catch(err) {
        alert('Failed to update priority source daimon');
      }        
      this.isInProgress(false);
    }

    updateVocabPriority() {
      var newVocabUrl = sharedState.vocabularyUrl();
      var selectedSource = sharedState.sources().find((item) => { return item.vocabularyUrl === newVocabUrl; });
      updateSourceDaimonPriority(selectedSource.sourceKey, 'Vocabulary');
      return true;
    };

    updateEvidencePriority() {
      var newEvidenceUrl = sharedState.evidenceUrl();
      var selectedSource = sharedState.sources().find((item) => { return item.evidenceUrl === newEvidenceUrl; });
      updateSourceDaimonPriority(selectedSource.sourceKey, 'Evidence');
      return true;
    };

    updateResultsPriority() {
      var newResultsUrl = sharedState.resultsUrl();
      var selectedSource = sharedState.sources().find((item) => { return item.resultsUrl === newResultsUrl; });
      updateSourceDaimonPriority(selectedSource.sourceKey, 'Results');
      return true;
    };
    
    checkSourceConnection(source) {
      sourceApi.checkSourceConnection(source.sourceKey).then(
        () => source.connectionCheck(sourceApi.connectionCheckState.success), 
        () => source.connectionCheck(sourceApi.connectionCheckState.failed)
      );
      source.connectionCheck(sourceApi.connectionCheckState.checking);
    };
    
    getCheckButtonStyles(source) {
      let iconClass = 'fa-caret-right';
      let buttonClass = 'btn-primary';
      switch(source.connectionCheck()) {
        case sourceApi.connectionCheckState.success:
          buttonClass = 'btn-success';
          iconClass = 'fa-check-square';
          break;
        case sourceApi.connectionCheckState.failed:
          buttonClass = 'btn-danger';
          iconClass = 'fa-exclamation-circle';
          break;
        case sourceApi.connectionCheckState.checking:
          buttonClass = 'btn-warning';
          iconClass = 'fa-circle-o-notch fa-spin';
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
