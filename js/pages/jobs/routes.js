define(
  (require, factory) => {
    const { AuthorizedRoute } = require('providers/Route');
    function routes(appModel) {
      return {        
        '/jobs': new AuthorizedRoute(() => {
          appModel.activePage(this.title);
          require(['./job-manager'], function () {
            appModel.currentView('job-manager');
          });
        }),
      };
    }

    return routes;
  }
);