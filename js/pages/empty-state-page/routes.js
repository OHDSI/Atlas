
define(
  (require, factory) => {
    const { Route } = require('pages/Route');
    function routes(appModel, router) {
      return {        
        '/not-found': new Route(() => {
          appModel.activePage(this.title);
          require(['./empty-state-page'], function () {
            router.setCurrentView('empty-state-page');
          });
        }),
      };
    }

    return routes;
  }
);
