define(
  (require, factory) => {
    const { Route } = require('pages/Route');
    function routes(appModel, router) {
      return {
        '/feedback': new Route(() => {
          require(['feedback'], function () {
            router.setCurrentView('feedback');
          });
        }),
      };
    }

    return routes;
  }
);