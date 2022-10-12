define(
	(require, factory) => {
    const { AuthorizedRoute } = require('pages/Route');
    function routes(router) {
      return {
        '/tagging': new AuthorizedRoute(() => {
          require(['pages/tagging/tagging-manager'], function () {
            router.setCurrentView('tagging-manager');
          });
        }),
      };
    }

    return routes;
  }
);