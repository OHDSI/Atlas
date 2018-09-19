define(
  (require, factory) => {
    const { AuthorizedRoute } = require('providers/Route');
    function routes(appModel, router) {
      return {
        '/datasources': new AuthorizedRoute(() => {
          appModel.activePage(this.title);
          require(['./data-sources'], function () {
            router.setCurrentView('data-sources');
          });
        }),
        '/datasources/:sourceKey/:reportName': new AuthorizedRoute((sourceKey, reportName) => {
          appModel.activePage(this.title);
          require(['./data-sources'], function () {
            appModel.componentParams({
              reportName: reportName,
              sourceKey: sourceKey
            });
            router.setCurrentView('data-sources');
          });
        }),
      };
    }

    return routes;
  }
);