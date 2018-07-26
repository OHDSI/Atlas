define(['knockout', 'text!./configuration.html', 'appConfig', 'webapi/AuthAPI', 'webapi/SourceAPI', 'utils/BemHelper', 'atlas-state', 'components/ac-access-denied', 'databindings', 'less!./configuration.less'], function (ko, view, config, authApi, sourceApi, BemHelper, sharedState) {
	function configuration(params) {
		var self = this;
		self.config = config;
		self.api = config.api;
		self.sharedState = sharedState;
    self.isInProgress = ko.observable(false);
		self.sources = sharedState.sources;
		self.priorityOptions = [
      {name: 'Current Session', id: 'session'},
      {name: 'Whole Application', id: 'application'},
    ];

		self.isAuthenticated = authApi.isAuthenticated;
		self.initializationCompleted = ko.pureComputed(() => sharedState.appInitializationStatus() === 'complete' || sharedState.appInitializationStatus() === 'no-sources-available');
		self.hasAccess = ko.pureComputed(function () {
			return (config.userAuthenticationEnabled && self.isAuthenticated() && authApi.isPermittedEditConfiguration()) || !config.userAuthenticationEnabled;
		});
		self.canReadRoles = ko.pureComputed(function () {
			return self.isAuthenticated() && authApi.isPermittedReadRoles();
		});
		self.canCreateSource = ko.pureComputed(function () {
			if (!config.userAuthenticationEnabled) {
				return false;
			} else {
				return (config.userAuthenticationEnabled && self.isAuthenticated() && authApi.isPermittedCreateSource());
			}
    });
    self.canChangePriority = ko.pureComputed(function () {
			if (!config.userAuthenticationEnabled) {
				return false;
			} else {
				return (config.userAuthenticationEnabled && self.isAuthenticated() && authApi.isPermittedEditSourcePriority())
			}
    });
    self.canReadSource = function(source) {
			if (!config.userAuthenticationEnabled) {
				return false;
			} else {
				return (config.userAuthenticationEnabled && self.isAuthenticated() && authApi.isPermittedReadSource(source.sourceKey));
			}
    };
		self.canCheckConnection = function(source) {
			if (!config.userAuthenticationEnabled) {
				return false;
			} else {
				return (config.userAuthenticationEnabled && self.isAuthenticated() && authApi.isPermittedCheckSourceConnection(source.sourceKey));
			}
		};
		self.clearLocalStorageCache = function () {
			localStorage.clear();
			alert("Local Storage has been cleared.  Please refresh the page to reload configuration information.")
		};

		self.newSource = function () {
			document.location = "#/source/new";
    };

		self.selectSource = function(source) {
			document.location = "#/source/" + source.sourceId;
		};

    function updateSourceDaimonPriority(sourceKey, daimonType) {
      if (self.sharedState.priorityScope() !== 'application') {
        return;
      }
      self.isInProgress(true);
      $.ajax({
        url: config.api.url + 'source/' + sourceKey + '/daimons/' + daimonType + '/set-priority',
        timeout: 20000,
        method: 'POST',
        contentType: 'application/json',
        success: function () {
          sourceApi.initSourcesConfig();
        },
        error: function (err) {
          alert('Failed to update priority source daimon');
        },
        complete: function () {
          self.isInProgress(false);
        }
      });
    }

    self.updateVocabPriority = function() {
      var newVocabUrl = self.sharedState.vocabularyUrl();
      var selectedSource = self.sharedState.sources().find(function(item){ return item.vocabularyUrl === newVocabUrl; });
      updateSourceDaimonPriority(selectedSource.sourceKey, 'Vocabulary');
      return true;
    };

    self.updateEvidencePriority = function() {
      var newEvidenceUrl = self.sharedState.evidenceUrl();
      var selectedSource = self.sharedState.sources().find(function(item){ return item.evidenceUrl === newEvidenceUrl; });
      updateSourceDaimonPriority(selectedSource.sourceKey, 'Evidence');
      return true;
    };

    self.updateResultsPriority = function() {
      var newResultsUrl = self.sharedState.resultsUrl();
      var selectedSource = self.sharedState.sources().find(function(item){ return item.resultsUrl === newResultsUrl; });
      updateSourceDaimonPriority(selectedSource.sourceKey, 'Results');
      return true;
    };
    
    self.checkSourceConnection = function(source) {
      sourceApi.checkSourceConnection(source.sourceKey).then(
        () => source.connectionCheck(sourceApi.connectionCheckState.success), 
        () => source.connectionCheck(sourceApi.connectionCheckState.failed)
      );
      source.connectionCheck(sourceApi.connectionCheckState.checking);
    };
    
    self.getCheckButtonStyles = function(source) {
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


	var component = {
		viewModel: configuration,
		template: view
	};

	ko.components.register('ohdsi-configuration', component);
	return component;
});
