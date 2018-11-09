define(
	(require, factory) => {
    const { Route } = require('pages/Route');
    const authApi = require('services/AuthAPI');
    
    function routes(appModel, router) {
      return {
        '/': new Route(() => {
          appModel.activePage(this.title);
          document.location = "#/home";
        }),
        '/home': new Route(() => {
          appModel.activePage(this.title);
          require(['./home'], function () {
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