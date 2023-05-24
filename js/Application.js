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
				this.hasUnsavedChanges = ko.pureComputed(() => {
					return (sharedState.RepositoryConceptSet.dirtyFlag().isDirty()
						|| sharedState.CohortDefinition.dirtyFlag().isDirty()
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

				this.toggleBrowserWarning = function(bowser) {
					const browserInfo = bowser.getParser(navigator.userAgent).getBrowser();
					const isBrowserSupported = browserInfo.name.toLowerCase() === 'chrome' && parseInt(browserInfo.version) > 63;
					return !config.disableBrowserCheck && !isBrowserSupported;
				}

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
				});
				this.companyInfoTemplate = config.companyInfoCustomHtmlTemplate;
				this.showCompanyInfo = config.showCompanyInfo;
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
							// Routes to welcome are part of auth flow, loadUserInfo in this case is unnecessary and fails. 
							// More importantly it can trigger an infinite loop when skipLoginEnabled is enabled.
							if (!window.location.href.includes("/welcome/")) {
								await authApi.loadUserInfo();
							}
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
