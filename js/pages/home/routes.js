define(
  (require, factory) => {
    const { Route } = require('providers/Route');
    const AuthService = require('services/AuthService');
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
            AuthService.token(token);
            document.location = "#/welcome";
          });
        }),
      };
    }

    return routes;
  }
);