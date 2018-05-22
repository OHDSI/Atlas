define(
  (require, factory) => {
    function routes(appModel) {
      return {        
        '/feedback': () => {
          appModel.activePage(this.title);
          require(['feedback'], function () {
            appModel.componentParams = {
              model: appModel,
            };
            appModel.currentView('feedback');
          });
        },
      };
    }

    return routes;
  }
);