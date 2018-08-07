define(
  (require, factory) => {
    const { AuthorizedRoute } = require('providers/Route');
    function routes(appModel) {
      return {
        '/datasources': new AuthorizedRoute(() => {
          appModel.activePage(this.title);
          require(['./data-sources'], function () {
            appModel.currentView('data-sources');
          });
        }),
        '/datasources/:sourceKey/:reportName': new AuthorizedRoute((sourceKey, reportName) => {
          appModel.activePage(this.title);
          require(['./data-sources'], function () {
            appModel.componentParams({
              reportName: reportName,
              sourceKey: sourceKey
            });
            appModel.currentView('data-sources');
          });
        }),
      };
    }

    return routes;
  }
);