define(
  (require, factory) => {
    function routes(appModel) {
      return {
        '/datasources': () => {
          appModel.activePage(this.title);
          require(['./data-sources'], function () {
            appModel.componentParams = {
              model: appModel
            };
            appModel.currentView('data-sources');
          });
        },
        '/datasources/:sourceKey/:reportName': (sourceKey, reportName) => {
          appModel.activePage(this.title);
          require(['./data-sources'], function () {
            appModel.componentParams = {
              model: appModel,
              reportName: reportName,
              sourceKey: sourceKey
            };
            appModel.currentView('data-sources');
          });
        },
      };
    }

    return routes;
  }
);