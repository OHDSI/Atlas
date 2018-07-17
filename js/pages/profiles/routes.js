define(
  (require, factory) => {
    function routes(appModel) {
      return {        
        '/profiles/?((\w|.)*)': (path) => {
          appModel.activePage(this.title);
          require(['profile-manager', 'components/cohort-definition-browser'], function () {
            path = path.split("/");
            appModel.componentParams = {
              model: appModel,
              sourceKey: (path[0] || null),
              personId: (path[1] || null),
              cohortDefinitionId: (path[2] || null)
            };
            appModel.currentView('profile-manager');
          });
        },
      };
    }

    return routes;
  }
);