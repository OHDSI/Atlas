define(
	[
    'pages/Route',
    'services/AuthAPI'
	],
	({ Route }, authApi) => {
    
    function routes(appModel, router) {
      return {
        '/': new Route(() => {
          appModel.activePage(this.title);
          document.location = "#/home";
        }),
        '/home': new Route(() => {
          appModel.activePage(this.title);
          require(['pages/home/home'], function () {
            router.setCurrentView('home');
          });
        }),
        '/welcome/:token': new Route((token) => {
          appModel.activePage(this.title);
          require(['welcome'], function () {
            authApi.token(token);
            document.location = "#/welcome";
          });
        }),
      };
    }

    return routes;
  }
);