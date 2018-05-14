define(
  (require, factory) => {
    function dataSourcesRoutes(appModel) {
      return {
        '/datasources': function () {
          require(['./data-sources'], function () {
            appModel.componentParams = {
              model: appModel
            };
            appModel.currentView('data-sources');
          });
        },
        '/datasources/:sourceKey/:reportName': function (sourceKey, reportName) {
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

    return dataSourcesRoutes;
  }
);