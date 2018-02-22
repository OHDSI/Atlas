define(['knockout', 'text!./CohortConceptSetBrowserTemplate.html', 'vocabularyprovider', 'appConfig', 'conceptsetbuilder/InputTypes/ConceptSet', 'webapi/AuthAPI', 'webapi/MomentAPI', 'access-denied', 'databindings'], function (ko, template, VocabularyProvider, appConfig, ConceptSet, authApi, momentApi) {
	function CohortConceptSetBrowser(params) {
		var self = this;

		function defaultRepositoryConceptSetSelected(conceptSet) {
			// Default functionality
			VocabularyProvider.getConceptSetExpression(conceptSet.id, self.selectedSource()
					.url)
				.done(function (result) {
					var newId = self.cohortConceptSets()
						.length > 0 ? Math.max.apply(null, self.cohortConceptSets()
							.map(function (d) {
								return d.id;
							})) + 1 : 0;

					var newConceptSet = new ConceptSet({
						id: newId,
						name: conceptSet.name,
						expression: result
					});
					params.$raw.cohortConceptSets()
						.push(newConceptSet);
					self.criteriaContext() && self.criteriaContext()
						.conceptSetId(newConceptSet.id);
					self.onActionComplete({
						action: 'load',
						status: 'Success'
					});
				})
				.fail(function (err) {
					console.log(err);
				});
		}


		function setDisabledConceptSetButton(action) {
			if (action && action()) {
				return action()
			} else {
				return false;
			}
		}

    self.formatDate = function(data, type, row) {
    	return momentApi.formatDateTimeUTC(data);
		};

		self.criteriaContext = params.criteriaContext;
		self.cohortConceptSets = params.cohortConceptSets;
		self.onActionComplete = params.onActionComplete;
		self.onRespositoryConceptSetSelected = params.onRespositoryConceptSetSelected || defaultRepositoryConceptSetSelected;
		self.disableConceptSetButton = setDisabledConceptSetButton(params.disableConceptSetButton);
		self.buttonActionText = params.buttonActionText || "New Concept Set";
		self.repositoryConceptSetTableId = params.repositoryConceptSetTableId || "repositoryConceptSetTable";

		self.loading = ko.observable(false);
		self.repositoryConceptSets = ko.observableArray();

		self.sources = [];
		self.sources.push(appConfig.api);
		self.selectedSource = ko.observable(self.sources[0]);

		self.isAuthenticated = authApi.isAuthenticated;
		self.canReadConceptsets = ko.pureComputed(function () {
		  return (appConfig.userAuthenticationEnabled && self.isAuthenticated() && authApi.isPermittedReadConceptsets()) || !appConfig.userAuthenticationEnabled;
		});
		self.canReadCohorts = ko.pureComputed(function () {
		  return (config.userAuthenticationEnabled && self.isAuthenticated() && authApi.isPermittedReadCohorts()) || !config.userAuthenticationEnabled;
		});

		self.loadConceptSetsFromRepository = function (url) {
			self.loading(true);

			VocabularyProvider.getConceptSetList(url)
				.done(function (results) {
					self.repositoryConceptSets(results);
					self.loading(false);
				})
				.fail(function (err) {
					console.log(err);
				});
		}

		// datatable callbacks:

		self.selectRepositoryConceptSet = function (data, context, event) {
			self.onRespositoryConceptSetSelected(data, event);
		}

		self.addConceptSet = function () {
			self.onActionComplete({
				action: 'add',
				status: 'Success'
			});
		}

		// dispose subscriptions

		// startup actions
		self.loadConceptSetsFromRepository(self.selectedSource()
			.url);
	}

	var component = {
		viewModel: CohortConceptSetBrowser,
		template: template
	};

	return component;
});
