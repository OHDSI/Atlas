define(
	[
		'knockout',
		'services/http',
		'webapi/AuthAPI',
		'appConfig',
		'lscache',
		'atlas-state',
		'jquery',
		'webapi/ExecutionAPI',
		'webapi/SourceAPI',
		'providers/Model',
		'databindings',
	],
	(
		ko,
		httpService,
		authApi,
		config,
		lscache,
		sharedState,
		$, // TODO: get rid of jquery
		executionAPI,
		sourceApi,
		GlobalModel,
	) => {
		return class Application {
			constructor(model, router) {
				// establish base priorities for daimons
				this.evidencePriority = 0;
				this.vocabularyPriority = 0;
				this.densityPriority = 0;
				this.pageModel = model;
				this.router = router;
			}
			
			/**
			 * Performs initial setup
			 * @returns Promise
			*/
			bootstrap() {
				const promise = new Promise(async (resolve, reject) => {
					$.support.cors = true;
					sharedState.appInitializationStatus(ko.observable('initializing'));
					config.api.isExecutionEngineAvailable = ko.observable(false);
					ko.applyBindings({
						// provide to a view access to both model and the router via this.router
						...this.pageModel,
						...this,
					}, document.getElementsByTagName('html')[0]);
					httpService.setUnauthorizedHandler(() => authApi.resetAuthParams());
					httpService.setUserTokenGetter(() => authApi.getAuthorizationHeader());
					authApi.isAuthenticated.subscribe(executionAPI.checkExecutionEngineStatus);
					this.router.setCurrentViewHandler(view => this.pageModel.currentView(view));
					this.router.setModelGetter(() => this.pageModel);
					this.attachGlobalEventListeners();
					await executionAPI.checkExecutionEngineStatus(authApi.isAuthenticated());

					resolve();
				});

				return promise;
			}

			/**
			 * Fetches all the data required for app's functioning
			 * @returns Promise
			 */
			synchronize() {
				const promise = Promise.all([
					this.initServiceInformation(),
					this.pageModel.updateRoles(),
				]);
				promise.then(() => {
					this.router.run();
				});

				return promise;
			}

			/**
			 * Starts business logic
			 */
			run() {
				sharedState.appInitializationStatus(GlobalModel.applicationStatuses.running);
			}

			// service methods

			attachGlobalEventListeners() {
				const self = this;
				// handle select all
					$(document)
					.on('click', 'th i.fa.fa-shopping-cart', function () {
						if (self.pageModel.currentConceptSet() == undefined) {
							var newConceptSet = {
								name: ko.observable("New Concept Set"),
								id: 0
							}
							self.pageModel.currentConceptSet(newConceptSet);
						}

						var table = $(this)
							.closest('.dataTable')
							.DataTable();
						var concepts = table.rows({
								search: 'applied'
							})
							.data();
						var selectedConcepts = sharedState.selectedConcepts();

						for (var i = 0; i < concepts.length; i++) {
							var concept = concepts[i];
							if (sharedState.selectedConceptsIndex[concept.CONCEPT_ID]) {
								// ignore if already selected
							} else {
								var conceptSetItem = self.pageModel.createConceptSetItem(concept);
								sharedState.selectedConceptsIndex[concept.CONCEPT_ID] = 1;
								selectedConcepts.push(conceptSetItem)
							}
						}
						sharedState.selectedConcepts(selectedConcepts);
						ko.contextFor(this)
							.$component.reference.valueHasMutated();
					});

				// handling concept set selections
				$(document)
					.on('click', 'td i.fa.fa-shopping-cart, .asset-heading i.fa.fa-shopping-cart', function () {
						if (self.pageModel.currentConceptSet() == undefined) {
							var newConceptSet = {
								name: ko.observable("New Concept Set"),
								id: 0
							}
							self.pageModel.currentConceptSet({
								name: ko.observable('New Concept Set'),
								id: 0
							});
							self.pageModel.currentConceptSetSource('repository');
						}

						$(this)
							.toggleClass('selected');
						var concept = ko.contextFor(this)
							.$data;

						if ($(this)
							.hasClass('selected')) {
							var conceptSetItem = self.pageModel.createConceptSetItem(concept);
							sharedState.selectedConceptsIndex[concept.CONCEPT_ID] = 1;
							sharedState.selectedConcepts.push(conceptSetItem);
						} else {
							delete sharedState.selectedConceptsIndex[concept.CONCEPT_ID];
							sharedState.selectedConcepts.remove(function (i) {
								return i.concept.CONCEPT_ID === concept.CONCEPT_ID;
							});
						}

						// If we are updating a concept set that is part of a cohort definition
						// then we need to notify any dependent observables about this change in the concept set
						if (self.pageModel.currentCohortDefinition() && self.pageModel.currentConceptSetSource() === "cohort") {
							var conceptSet = self.pageModel.currentCohortDefinition()
								.expression()
								.ConceptSets()
								.find(function (item) {
									return item.id === self.pageModel.currentConceptSet().id;
								});
							if (!$(this).hasClass("selected")) {
								conceptSet.expression.items.remove(function (i) {
									return i.concept.CONCEPT_ID === concept.CONCEPT_ID;
								});
							}
							conceptSet.expression.items.valueHasMutated();
							self.pageModel.resolveConceptSetExpressionSimple(ko.toJSON(conceptSet.expression))
								.then(self.pageModel.loadIncluded)
								.then(self.pageModel.loadSourcecodes);
						}
					});

				// concept set selector handling
				$(document)
					.on('click', '.conceptSetTable i.fa.fa-shopping-cart', function () {
						$(this)
							.toggleClass('selected');
						var conceptSetItem = ko.contextFor(this)
							.$data;

						delete sharedState.selectedConceptsIndex[conceptSetItem.concept.CONCEPT_ID];
						sharedState.selectedConcepts.remove(function (i) {
							return i.concept.CONCEPT_ID == conceptSetItem.concept.CONCEPT_ID;
						});

						self.pageModel.resolveConceptSetExpression();
					});

				$(window)
					.bind('beforeunload', function () {
						if (self.pageModel.hasUnsavedChanges())
							return "Changes will be lost if you do not save.";
					});
			}

			/**
			 * Initialize all service information asynchronously
			 * @returns Promise
			 */
			initServiceInformation() {
				console.info('Initializing service information');
				return new Promise((resolve, reject) => {
					const serviceCacheKey = 'ATLAS|' + config.api.url;
					const cachedService = lscache.get(serviceCacheKey);

					if (cachedService && cachedService.sources) {
						console.info('cached service');
						config.api = cachedService;

						for (var s = 0; s < cachedService.sources.length; s++) {
							var source = cachedService.sources[s];

							for (var d = 0; d < source.daimons.length; d++) {
								var daimon = source.daimons[d];

								if (daimon.daimonType == 'Vocabulary') {
									if (daimon.priority >= this.vocabularyPriority) {
										this.vocabularyPriority = daimon.priority;
										sharedState.vocabularyUrl(source.vocabularyUrl);
									}
								}

								if (daimon.daimonType == 'Evidence') {
									if (daimon.priority >= this.evidencePriority) {
										this.evidencePriority = daimon.priority;
										sharedState.evidenceUrl(source.evidenceUrl);
									}
								}

								if (daimon.daimonType == 'Results') {
									if (daimon.priority >= this.densityPriority) {
										this.densityPriority = daimon.priority;
										sharedState.resultsUrl(source.resultsUrl);
									}
								}
							}
						}
					} else {
						sharedState.sources([]);

						if (!authApi.isAuthenticated()) {
							this.authSubscription = authApi.isAuthenticated.subscribe(async (isAuthed) => {
								if (isAuthed) {
									await sourceApi.initSourcesConfig();
									this.authSubscription.dispose();
									console.info('Re-initialized service information');
								}
							});

							resolve();
							return;
						}
					}
					console.info('Done initializing service information');
					sourceApi.initSourcesConfig();
					resolve();
				});
			}

		}
	}
)