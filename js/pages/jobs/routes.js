define(
	[
		'pages/Route'
	],
	({ AuthorizedRoute }) => {
    function routes(appModel, router) {
      return {        
        '/jobs': new AuthorizedRoute(() => {
          appModel.activePage(this.title);
          require(['pages/jobs/job-manager'], function () {
            router.setCurrentView('job-manager');
          });
        }),
      };
    }

    return routes;
  }
);