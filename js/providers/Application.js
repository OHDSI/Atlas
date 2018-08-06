define(
	[
		'knockout',
		'services/http',
		'webapi/AuthAPI',
		'webapi/RoleAPI',
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
		roleApi,
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
					this.updateRoles(),
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
				// handle select all
					$(document)
					.on('click', 'th i.fa.fa-shopping-cart', function () {
						if (this.pageModel.currentConceptSet() == undefined) {
							var newConceptSet = {
								name: ko.observable("New Concept Set"),
								id: 0
							}
							this.pageModel.currentConceptSet(newConceptSet);
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
								var conceptSetItem = this.pageModel.createConceptSetItem(concept);
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
						if (this.pageModel.currentConceptSet() == undefined) {
							var newConceptSet = {
								name: ko.observable("New Concept Set"),
								id: 0
							}
							this.pageModel.currentConceptSet({
								name: ko.observable('New Concept Set'),
								id: 0
							});
							this.pageModel.currentConceptSetSource('repository');
						}

						$(this)
							.toggleClass('selected');
						var concept = ko.contextFor(this)
							.$data;

						if ($(this)
							.hasClass('selected')) {
							var conceptSetItem = this.pageModel.createConceptSetItem(concept);
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
						if (this.pageModel.currentCohortDefinition() && this.pageModel.currentConceptSetSource() === "cohort") {
							var conceptSet = this.pageModel.currentCohortDefinition()
								.expression()
								.ConceptSets()
								.find(function (item) {
									return item.id === this.pageModel.currentConceptSet().id;
								});
							if (!$(this).hasClass("selected")) {
								conceptSet.expression.items.remove(function (i) {
									return i.concept.CONCEPT_ID === concept.CONCEPT_ID;
								});
							}
							conceptSet.expression.items.valueHasMutated();
							this.pageModel.resolveConceptSetExpressionSimple(ko.toJSON(conceptSet.expression))
								.then(this.pageModel.loadIncluded)
								.then(this.pageModel.loadSourcecodes);
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

						this.pageModel.resolveConceptSetExpression();
					});

				$(window)
					.bind('beforeunload', function () {
						if (this.pageModel.hasUnsavedChanges())
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
						console.log('cached service');
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
						}
					}
					console.info('Done initializing service information');
					sourceApi.initSourcesConfig();
					resolve();
				});
			}

			updateRoles() {
				console.log('Updating roles');
				if (this.pageModel.roles() && this.pageModel.roles().length > 0) {
					console.log('Roles updated');
					return Promise.resolve();
				} else {

					return httpService.doGet(config.api.url + 'role')
						.then(({ data }) => {
							console.log('Roles updated');
							this.pageModel.roles(data);
						})
						.catch(er => {
							console.warn('Unable to update roles');
						});
				}
			}
		}
	}
)