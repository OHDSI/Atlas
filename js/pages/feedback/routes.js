define(
  (require, factory) => {
    const { Route } = require('pages/Route');
    function routes(router) {
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