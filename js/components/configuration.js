define(['knockout', 'text!./configuration.html', 'appConfig', 'webapi/AuthAPI', 'webapi/SourceAPI', 'atlas-state', 'access-denied'], function (ko, view, config, authApi, sourceApi, sharedState) {
	function configuration(params) {
		var self = this;
		self.config = config;
		self.api = config.api;
		self.sharedState = sharedState;
    self.isInProgress = ko.observable(false);
		self.sources = ko.observableArray(config.api.sources);
		self.priorityOptions = [
      {name: 'Current Session', id: 'session'},
      {name: 'Whole Application', id: 'application'},
    ];

		self.isAuthenticated = authApi.isAuthenticated;
		self.hasAccess = ko.pureComputed(function () {
			return (config.userAuthenticationEnabled && self.isAuthenticated() && authApi.isPermittedEditConfiguration()) || !config.userAuthenticationEnabled;
		});
		self.canReadRoles = ko.pureComputed(function () {
			return self.isAuthenticated() && authApi.isPermittedReadRoles();
		});
		self.canCreateSource = ko.pureComputed(function () {
      return (config.userAuthenticationEnabled && self.isAuthenticated() && authApi.isPermittedCreateSource()) || !config.userAuthenticationEnabled;
    });
    self.canChangePriority = ko.pureComputed(function () {
      return (config.userAuthenticationEnabled && self.isAuthenticated() && authApi.isPermittedEditSourcePriority()) || !config.userAuthenticationEnabled;
    });
    self.canReadSource = function(source) {
      return (config.userAuthenticationEnabled && self.isAuthenticated()
        && authApi.isPermittedReadSource(source.sourceKey)) || !config.userAuthenticationEnabled;
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
          self.isInProgress(false);
          alert('Failed to update priority source daimon');
        },
        complete: function () {
          self.isInProgress(false);
        }
      });
    }

    self.updateVocabPriority = function() {
      var newVocabUrl = self.sharedState.vocabularyUrl();
      var selectedSource = self.config.api.sources.find(function(item){ return item.vocabularyUrl === newVocabUrl; });
      updateSourceDaimonPriority(selectedSource.sourceKey, 'Vocabulary');
      return true;
    };

    self.updateEvidencePriority = function() {
      var newEvidenceUrl = self.sharedState.evidenceUrl();
      var selectedSource = self.config.api.sources.find(function(item){ return item.evidenceUrl === newEvidenceUrl; });
      updateSourceDaimonPriority(selectedSource.sourceKey, 'Evidence');
      return true;
    };

    self.updateResultsPriority = function() {
      var newResultsUrl = self.sharedState.resultsUrl();
      var selectedSource = self.config.api.sources.find(function(item){ return item.resultsUrl === newResultsUrl; });
      updateSourceDaimonPriority(selectedSource.sourceKey, 'Results');
      return true;
    };
	}


	var component = {
		viewModel: configuration,
		template: view
	};

	ko.components.register('ohdsi-configuration', component);
	return component;
});
