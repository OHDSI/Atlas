define(
	(require, factory) => {
    const { AuthorizedRoute } = require('pages/Route');
    function routes(appModel, router) {
      return {        
        '/profiles/?((\w|.)*)': new AuthorizedRoute((path) => {
          appModel.activePage(this.title);
          require(['./profile-manager', 'components/cohort-definition-browser'], function () {
            path = path.split("/");
            const params = {};
            params.sourceKey = (path[0] || null);
            params.personId = (path[1] || null);
            params.cohortDefinitionId = (path[2] || null);

            router.setCurrentView('profile-manager', params);
          });
        }),
      };
    }

    return routes;
  }
);