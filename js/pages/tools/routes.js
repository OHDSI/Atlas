define(
	(require, factory) => {
    const { AuthorizedRoute } = require('pages/Route');
    function routes(router) {
      return {
        '/tools': new AuthorizedRoute(() => {
          require(['pages/tools/tool-manager'], function () {
            router.setCurrentView('tool-manager');
          });
        }),
      };
    }

    return routes;
  }
);