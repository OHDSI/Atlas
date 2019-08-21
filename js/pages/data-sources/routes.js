define(
	(require, factory) => {
    const { AuthorizedRoute } = require('pages/Route');
    function routes(router) {
      return {
        '/datasources': new AuthorizedRoute(() => {
          require(['./data-sources'], function () {
            router.setCurrentView('data-sources');
          });
        }),
        '/datasources/:sourceKey/:reportName': new AuthorizedRoute((sourceKey, reportName) => {
          require(['./data-sources'], function () {
            router.setCurrentView('data-sources', {
              reportName: reportName ? decodeURIComponent(reportName) : reportName,
              sourceKey: sourceKey ? decodeURIComponent(sourceKey) : sourceKey,
            });
          });
        }),
      };
    }

    return routes;
  }
);