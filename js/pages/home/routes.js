define(
	(require, factory) => {
    const { Route } = require('pages/Route');
    const authApi = require('services/AuthAPI');

    function routes(appModel, router) {
      return {
        '/': new Route(() => {
          document.location = "#/home";
        }),
        '/home': new Route(() => {
          require(['./home'], function () {
            router.setCurrentView('home');
          });
        }),
        '/welcome/:token': new Route((token) => {
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