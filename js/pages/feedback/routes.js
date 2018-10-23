define(
  (require, factory) => {
    const { Route } = require('pages/Route');
    function routes(appModel, router) {
      return {        
        '/feedback': new Route(() => {
          appModel.activePage(this.title);
          require(['feedback'], function () {
            router.setCurrentView('feedback');
          });
        }),
      };
    }

    return routes;
  }
);