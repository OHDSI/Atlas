define(
	(require, factory) => {
    const { Route } = require('pages/Route');
    const authApi = require('services/AuthAPI');

    function routes(router) {
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
            authApi.loadUserInfo();
            document.location = "#/welcome";
          });
        }),
      };
    }

    return routes;
  }
);