define(
  (require, factory) => {
    const { AuthorizedRoute } = require('providers/Route');
    function routes(appModel) {
      return {        
        '/profiles/?((\w|.)*)': new AuthorizedRoute((path) => {
          appModel.activePage(this.title);
          require(['profile-manager', 'components/cohort-definition-browser'], function () {
            path = path.split("/");
            appModel.componentParams({
              sourceKey: (path[0] || null),
              personId: (path[1] || null),
              cohortDefinitionId: (path[2] || null)
            });
            appModel.currentView('profile-manager');
          });
        }),
      };
    }

    return routes;
  }
);