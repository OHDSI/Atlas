define([
	'knockout',
	'text!./configuration.html',
	'appConfig',
	'webapi/AuthAPI',
	'webapi/SourceAPI',
	'atlas-state',
	'access-denied'
], function (ko, view, config, authApi, sourceAPI, sharedState) {
	function configuration(params) {
		var self = this;
		self.config = config;
		self.api = config.api;
		self.sharedState = sharedState;
    self.isInProgress = ko.observable(false);

		self.isAuthenticated = authApi.isAuthenticated;
		self.hasAccess = ko.pureComputed(function () {
			return self.isAuthenticated() && authApi.isPermittedEditConfiguration();
		});
		self.canChangePriority = ko.pureComputed(function () {
			return (config.userAuthenticationEnabled && self.isAuthenticated() && authApi.isPermittedEditSourcePriortiy()) || !config.userAuthenticationEnabled;
		});
		self.canReadRoles = ko.pureComputed(function () {
			return self.isAuthenticated() && authApi.isPermittedReadRoles();
		})
		self.clearLocalStorageCache = function () {
			localStorage.clear();
			alert("Local Storage has been cleared.  Please refresh the page to reload configuration information.")
		}

		self.updateVocabPriority = function() {
			const newVocabUrl = self.sharedState.vocabularyUrl();
			const selectedSource = self.config.api.sources.find(item => item.vocabularyUrl === newVocabUrl);
			console.log('Updating vocab priority: ' + selectedSource.sourceKey);
			updateSourceDaimonPriority(selectedSource.sourceKey, 'Vocabulary');
			return true;
		}

		self.updateEvidencePriority = function() {
			const newEvidenceUrl = self.sharedState.evidenceUrl();
			const selectedSource = self.config.api.sources.find(item => item.evidenceUrl === newEvidenceUrl);
			console.log('Updating evidence priority: ' + selectedSource.sourceKey);
			updateSourceDaimonPriority(selectedSource.sourceKey, 'Evidence');
			return true;
		}

		self.updateResultsPriority = function() {
			const newResultsUrl = self.sharedState.resultsUrl();
			const selectedSource = self.config.api.sources.find(item => item.resultsUrl === newResultsUrl);
			console.log('Updating results priority: ' + selectedSource.sourceKey);
			updateSourceDaimonPriority(selectedSource.sourceKey, 'Results');
			return true;
		}

		function updateSourceDaimonPriority(sourceKey, daimonType) {
			self.isInProgress(true);

			$.ajax({
				url: config.api.url + `source/${sourceKey}/daimons/${daimonType}/set-priority`,
				timeout: 20000,
				method: 'POST',
				contentType: 'application/json',
				success: function () {
					sourceAPI.initSourcesConfig();
				},
				error: function (err) {
					alert('Failed to update priority source daimon');
				},
				complete: function () {
					self.isInProgress(false);
				}
			});
		}
	}

	var component = {
		viewModel: configuration,
		template: view
	};

	ko.components.register('ohdsi-configuration', component);
	return component;
});
