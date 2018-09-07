define(
  (require, factory) => {
    const { AuthorizedRoute } = require('providers/Route');
    function routes(appModel, router) {
      return {        
        '/profiles/?((\w|.)*)': new AuthorizedRoute((path) => {
          appModel.activePage(this.title);
          require(['./profile-manager', 'components/cohort-definition-browser'], function () {
            path = path.split("/");
            router.setCurrentView('profile-manager', {
              sourceKey: (path[0] || null),
              personId: (path[1] || null),
              cohortDefinitionId: (path[2] || null)
            });
          });
        }),
      };
    }

    return routes;
  }
);