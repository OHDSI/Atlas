define(
  (require, factory) => {
    const { AuthorizedRoute } = require('providers/Route');
    function routes(appModel, router) {
      return {        
        '/jobs': new AuthorizedRoute(() => {
          appModel.activePage(this.title);
          require(['./job-manager'], function () {
            router.setCurrentView('job-manager');
          });
        }),
      };
    }

    return routes;
  }
);