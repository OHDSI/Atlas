define(
	[
		'knockout',
		'services/http',
		'services/AuthAPI',
		'services/role',
		'appConfig',
		'lscache',
		'atlas-state',
		'jquery',
		'services/Execution',
		'services/SourceAPI',
		'services/I18nService',
		'services/EventBus',
		'services/ConceptSet',
		'utils/CommonUtils',
		'utils/BemHelper',
		'const',
		'databindings',
		'less!app.less',
	],
	(
		ko,
		httpService,
		authApi,
		roleService,
		config,
		lscache,
		sharedState,
		$, // TODO: get rid of jquery
		executionService,
		sourceApi,
		i18nService,
		EventBus,
		conceptSetService,
		commonUtils,
		BemHelper,
		constants,
	) => {
		return class Application {
			constructor(router) {
				// establish base priorities for daimons
				this.evidencePriority = 0;
				this.vocabularyPriority = 0;
				this.densityPriority = 0;
				this.router = router;
				this.EventBus = EventBus;
				const bemHelper = new BemHelper('app');
				this.classes = bemHelper.run.bind(bemHelper);
				this.currentConceptSet = sharedState.ConceptSet.current;
				this.currentConceptSetSource = sharedState.ConceptSet.source;
				this.currentCohortDefinition = sharedState.CohortDefinition.current;
				this.hasUnsavedChanges = ko.pureComputed(() => {
					return (sharedState.CohortDefinition.dirtyFlag().isDirty()
						|| sharedState.ConceptSet.dirtyFlag().isDirty()
						|| sharedState.IRAnalysis.dirtyFlag().isDirty()
						|| sharedState.CohortPathways.dirtyFlag().isDirty()
						|| sharedState.estimationAnalysis.dirtyFlag().isDirty()
						|| sharedState.predictionAnalysis.dirtyFlag().isDirty()
						|| sharedState.CohortCharacterization.dirtyFlag().isDirty()
					);
				});
				this.initializationComplete = ko.pureComputed(() => {
					return sharedState.appInitializationStatus() != constants.applicationStatuses.initializing;
				});


				this.appInitializationStatus = sharedState.appInitializationStatus;
				this.noSourcesAvailable = ko.pureComputed(() => {
					return this.appInitializationStatus() === constants.applicationStatuses.noSourcesAvailable && this.router.currentView() !== 'ohdsi-configuration';
				});
				this.appInitializationErrorMessage =  ko.computed(() => {
					if (this.noSourcesAvailable()) {
						return ko.i18n('commonErrors.noSources', 'The current WebAPI has no sources defined.<br/>Please add one or more on <a href="#/configure">configuration</a> page.')();
					} else if (this.appInitializationStatus() !== constants.applicationStatuses.noSourcesAvailable) {
						return ko.i18n('commonErrors.webapiConnectError', 'Unable to connect to an instance of the WebAPI.<br/>Please contact your administrator to resolve this issue.')();
					}
				});
				this.pageTitle = ko.pureComputed(() => {
					let pageTitle = "ATLAS";
					switch (this.router.currentView()) {
						case 'loading':
							pageTitle = `${pageTitle}: ` + ko.i18n('common.loading', 'Loading')();
							break;
						default:
							pageTitle = `${pageTitle}: ${ko.unwrap(this.router.activeRoute().title)}`;
							break;
					}

					if (this.hasUnsavedChanges()) {
						pageTitle = `*${pageTitle} ` + ko.i18n('common.unsaved', '(unsaved)')();
					}

					return pageTitle;
				})
			}

			/**
			 * Performs initial setup
			 * @returns Promise
			*/
			bootstrap() {
				const promise = new Promise(async (resolve, reject) => {
					$.support.cors = true;
					sharedState.appInitializationStatus(ko.observable(constants.applicationStatuses.initializing));
					config.api.isExecutionEngineAvailable = ko.observable(false);
					ko.applyBindings({
						// provide to a view access to both model and the router via this.router
						...this,
					}, document.getElementsByTagName('html')[0]);
					httpService.setUnauthorizedHandler(() => authApi.resetAuthParams());
					httpService.setUserTokenGetter(() => authApi.getAuthorizationHeader());

					try{
						await i18nService.getAvailableLocales();
					} catch (e) {
						reject(e.message);
					}

					if (config.userAuthenticationEnabled) {
						try {
							await authApi.loadUserInfo();
						} catch (e) {
							reject(e.message);
						}

					}
					authApi.isAuthenticated.subscribe(executionService.checkExecutionEngineStatus);
					this.attachGlobalEventListeners();
					await executionService.checkExecutionEngineStatus(authApi.isAuthenticated());

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
					roleService.updateRoles(),
				]);
				promise.then(() => {
					this.router.run();
				});

				return promise;
			}
			// service methods

			attachGlobalEventListeners() {
				const self = this;
				// handle select all
					$(document)
					.on('click', 'th i.fa.fa-shopping-cart', function () {
						if (self.currentConceptSet() == undefined) {
							var newConceptSet = {
								name: ko.observable(constants.newEntityNames.conceptSet()),
								id: 0
							}
							self.currentConceptSet(newConceptSet);
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
								var conceptSetItem = commonUtils.createConceptSetItem(concept);
								sharedState.selectedConceptsIndex[concept.CONCEPT_ID] = 1;
								selectedConcepts.push(conceptSetItem)
							}
						}
						sharedState.selectedConcepts(selectedConcepts);
						for (var i = 0; i < table.rows()[0].length; i++) {
							table.cell(i,0).data('<i class="fa fa-shopping-cart"></i>');
						}
					});

				// handling concept set selections
				$(document)
					.on('click', 'td i.fa.fa-shopping-cart, .asset-heading i.fa.fa-shopping-cart', function () {
						if (self.currentConceptSet() == undefined) {
							var newConceptSet = {
								name: ko.observable(constants.newEntityNames.conceptSet()),
								id: 0
							}
							self.currentConceptSet({
								name: ko.observable(constants.newEntityNames.conceptSet()),
								id: 0
							});
							self.currentConceptSetSource('repository');
						}

						$(this)
							.toggleClass('selected');
						var concept = ko.contextFor(this)
							.$data;

						if ($(this)
							.hasClass('selected')) {
							var conceptSetItem = commonUtils.createConceptSetItem(concept);
							sharedState.selectedConceptsIndex[concept.CONCEPT_ID] = 1;
							sharedState.selectedConcepts.push(conceptSetItem);
							conceptSetService.setConceptSetExpressionExportItems();
						} else {
							delete sharedState.selectedConceptsIndex[concept.CONCEPT_ID];
							sharedState.selectedConcepts.remove(function (i) {
								return i.concept.CONCEPT_ID === concept.CONCEPT_ID;
							});
						}

						// If we are updating a concept set that is part of a cohort definition
						// then we need to notify any dependent observables about this change in the concept set
						if (self.currentCohortDefinition() && self.currentConceptSetSource() === "cohort") {
							var conceptSet = self.currentCohortDefinition()
								.expression()
								.ConceptSets()
								.find(function (item) {
									return item.id === self.currentConceptSet().id;
								});
							if (!$(this).hasClass("selected")) {
								conceptSet.expression.items.remove(function (i) {
									return i.concept.CONCEPT_ID === concept.CONCEPT_ID;
								});
							}
							conceptSet.expression.items.valueHasMutated();
							conceptSetService.resolveConceptSetExpressionSimple(conceptSet.expression);
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
						self.currentCohortDefinition() && self.currentCohortDefinition().expression().ConceptSets.valueHasMutated();
						conceptSetService.resolveConceptSetExpression();
					});

				$(window)
					.bind('beforeunload', function () {
						if (self.hasUnsavedChanges())
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
						config.api.sources = cachedService;
						sourceApi.setSharedStateSources(cachedService.sources);
						resolve();
					} else {
						sharedState.sources([]);

						if (config.userAuthenticationEnabled && !authApi.isAuthenticated()) {
							this.authSubscription = authApi.isAuthenticated.subscribe(async (isAuthed) => {
								if (isAuthed) {
									sharedState.appInitializationStatus(await sourceApi.initSourcesConfig());
									this.authSubscription.dispose();
									console.info('Re-initialized service information');
								}
							});
							sharedState.appInitializationStatus(constants.applicationStatuses.running);
							resolve();
							return;
						} else {
							sourceApi.initSourcesConfig()
								.then(function (appStatus) {
									sharedState.appInitializationStatus(appStatus);
									console.info('Init sources from server');
									resolve();
								});
						}
					}
				});
			}
			checkOAuthError() {
				let hash = window.location.hash;
				if (hash && hash.includes("oauth_error_email")) {
					alert("Empty email received from oauth server. Check whether it has public access");
				}
			}
		}
	}
)