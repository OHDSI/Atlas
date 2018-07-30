define(
  (require, factory) => {
    const { AuthorizedRoute } = require('providers/Route');
    function routes(appModel) {
      return {        
        '/jobs': new AuthorizedRoute(() => {
          appModel.activePage(this.title);
          require(['job-manager'], function () {
            appModel.componentParams = {
              model: appModel
            };
            appModel.currentView('job-manager');
          });
        }),
      };
    }

    return routes;
  }
);