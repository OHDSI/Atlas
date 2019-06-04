define(
	[
    'pages',
    'pages/vocabulary/index', // for not found route
    'querystring',
    'services/AuthAPI',
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
        this.activeRoute = null;
        this.onLoginSubscription;
        this.setCurrentView = () => { throw new Exception('View setter is not set'); };
        this.getModel = () => { throw new Exception('Model getter is not set'); };
        this.pages = Object.values(pages);
      }

      run() {
        const routerOptions = {
          notfound: () => this.handleNotFound(),
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
          const pageRoutes = page.buildRoutes(this.getModel(), this);
          for (let key in pageRoutes) {
            pageRoutes[key].title = page.title;
          }
          return {
            ...routes,
            ...pageRoutes,
          };
        }, {});
        const routesWithRefreshedToken = Object.keys(routes).reduce((accumulator, key) => {
					accumulator[key] = (...args) => {
            this.getModel().loading(true);
						if (this.onLoginSubscription) {
							this.onLoginSubscription.dispose();
						}
						const handler = routes[key].handler.bind(null, ...args);
						const title = routes[key].title;
						routes[key].checkPermission()
							.then(() => handler())
							.catch((ex) => {
								console.error(ex !== undefined ? ex : 'Permission error');
								this.getModel().activePage(title);
								// protected route didn't pass the token check -> show white page
								this.setCurrentView('white-page');
								// wait until user authenticates
								this.schedulePageUpdateOnLogin(handler);
              })
              .finally(() => {
                this.getModel().loading(false);
              });

            this.activeRoute = {
              handler,
              isSecured: routes[key].isSecured,
            };
					};
					return accumulator;
        }, {});
        // anyway, we should track the moment when the user exits and check permissions once again
				authApi.isAuthenticated.subscribe((isAuthenticated) => {
          const { isSecured, handler } = this.activeRoute;
          if (!isAuthenticated && isSecured) {
            this.setCurrentView('white-page');
            this.schedulePageUpdateOnLogin(handler);
          }
				});

        return routesWithRefreshedToken;
      }

      schedulePageUpdateOnLogin(routeHandler) {
        this.onLoginSubscription = authApi.isAuthenticated.subscribe((isAuthenticated) => {
          if (isAuthenticated) {
            routeHandler();
            this.onLoginSubscription.dispose();
          }
        });
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
