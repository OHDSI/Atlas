define(
	(require, factory) => {
    const { AuthorizedRoute } = require('pages/Route');
    function routes(router) {
      return {
        '/jobs': new AuthorizedRoute(() => {
          require(['pages/jobs/job-manager'], function () {
            router.setCurrentView('job-manager');
          });
        }),
      };
    }

    return routes;
  }
);