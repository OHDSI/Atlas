define(
  (require, factory) => {
    function routes(appModel) {
      return {        
        '/jobs': () => {
          appModel.activePage(this.title);
          require(['job-manager'], function () {
            appModel.componentParams = {
              model: appModel
            };
            appModel.currentView('job-manager');
          });
        },
      };
    }

    return routes;
  }
);