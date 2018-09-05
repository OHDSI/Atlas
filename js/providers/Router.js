define(
	[
    'pages',
    'pages/vocabulary/index', // for not found route
    'querystring',
    'webapi/AuthAPI',
    'director',
	],
	(
    pages,
    vocabularyPage,
    querystring,
    authApi,
	) => {
    return class AtlasRouter {
      constructor() {
        this.activeRouteHandler = null;
        this.onLoginSubscription;
        this.setCurrentView = () => { throw new Exception('View setter is not set'); };
        this.getModel = () => { throw new Exception('Model getter is not set'); };
        this.pages = Object.values(pages);
      }
      
      run() {
        const routerOptions = {
          notfound: () => this.handleNotFound(),
            // TODO:
          // on: () => this.getModel().componentParams({}),
        };
        this.router = new Router(this.aggregateRoutes());
        this.router.qs = this.qs;
        this.router.configure(routerOptions);
        this.router.init('/');
      }

      qs() {
        return querystring.parse(window.location.href.split('?')[1]);
      }

      handleNotFound() {
        this.router.setRoute(vocabularyPage.baseUrl);
      }

      aggregateRoutes() {
        const routes = this.pages.reduce((routes, page) => {
          return {
            ...routes,
            ...page.buildRoutes(this.getModel(), this),
          };
        }, {});
        const routesWithRefreshedToken = Object.keys(routes).reduce((accumulator, key) => {
					accumulator[key] = (...args) => {
                        // TODO:
					    //this.setCurrentView('loading');
						if (this.onLoginSubscription) {
							this.onLoginSubscription.dispose();
            }
						const handler = routes[key].handler.bind(null, ...args);
						routes[key].checkPermission()
							.then(() => handler())
							.catch(() => {
								// protected route didn't pass the token check -> show white page
								this.setCurrentView('white-page');
								// wait until user authenticates
								this.onLoginSubscription = authApi.isAuthenticated.subscribe((isAuthenticated) => {
									if (isAuthenticated) {
										handler();
										this.onLoginSubscription.dispose();
									}
								});
							});

						this.activeRouteHandler = handler;
					};
					return accumulator;
        }, {});
        // anyway, we should track the moment when the user exits and check permissions once again
				authApi.isAuthenticated.subscribe((isAuthenticated) => {
					if (!isAuthenticated) {
						this.activeRouteHandler();
					}
				});
        
        return routesWithRefreshedToken;
      }

      /**
       * Callback that should change the state of the model
       * @param {function} handler 
       */
      setCurrentViewHandler(handler) {
        this.setCurrentView = handler;
      }

      /**
       * Provides a way to get the reference to the global app model
       * @param {function} getter
       */
      setModelGetter(getter) {
        this.getModel = getter;
      }
		}
	}
);
