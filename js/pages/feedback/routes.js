define(
  (require, factory) => {
    const { Route } = require('providers/Route');
    function routes(appModel) {
      return {        
        '/feedback': new Route(() => {
          appModel.activePage(this.title);
          require(['feedback'], function () {
            appModel.currentView('feedback');
          });
        }),
      };
    }

    return routes;
  }
);