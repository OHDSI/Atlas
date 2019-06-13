define(['knockout', 'text!./CohortConceptSetBrowserTemplate.html', 'services/VocabularyProvider', 'appConfig', 'conceptsetbuilder/InputTypes/ConceptSet', 'services/AuthAPI', 'utils/DatatableUtils', 'components/ac-access-denied', 'databindings', 'css!./style.css'], function (ko, template, VocabularyProvider, appConfig, ConceptSet, authApi, datatableUtils) {
	function CohortConceptSetBrowser(params) {
		var self = this;

		function defaultRepositoryConceptSetSelected(conceptSet) {
			// Default functionality
			self.isProcessing(true);
			VocabularyProvider.getConceptSetExpression(conceptSet.id, self.selectedSource()
					.url)
				.then((result) => {
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
					// Waiting for modal's amination to end
					setTimeout(() => {
						self.isProcessing(false);
					}, 1000);
				})
				.catch((err) => {
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

		self.datatableUtils = datatableUtils;
		self.criteriaContext = params.criteriaContext;
		self.cohortConceptSets = params.cohortConceptSets;
		self.onActionComplete = params.onActionComplete;
		self.onRespositoryConceptSetSelected = params.onRespositoryConceptSetSelected || defaultRepositoryConceptSetSelected;
		self.disableConceptSetButton = setDisabledConceptSetButton(params.disableConceptSetButton);
		self.buttonActionEnabled = params.buttonActionEnabled !== false;
		self.buttonActionText = params.buttonActionText || "New Concept Set";
		self.repositoryConceptSetTableId = params.repositoryConceptSetTableId || "repositoryConceptSetTable";

		self.loading = ko.observable(false);
		self.repositoryConceptSets = ko.observableArray();
		self.isProcessing = ko.observable(false);

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
					datatableUtils.coalesceField(results, 'modifiedDate', 'createdDate');
					self.repositoryConceptSets(results);
					self.loading(false);
				})
				.fail(function (err) {
					console.log(err);
				});
		}

		// datatable callbacks:

		self.selectRepositoryConceptSet = function (data, context, event) {
			!self.isProcessing() && self.onRespositoryConceptSetSelected(data, self.selectedSource(), event);
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
