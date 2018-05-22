define(
  (require, factory) => {
    function routes(appModel) {
      return {
        '/configure': () => {
          appModel.activePage(this.title);
          require(['configuration', 'source-manager'], function () {
            appModel.componentParams = {
              model: appModel
            };
            appModel.currentView('ohdsi-configuration');
          });
        },
        '/roles': () => {
          appModel.activePage(this.title);
          require(['roles'], function () {
            appModel.componentParams = {
              model: appModel
            };
            appModel.currentView('roles');
          });
        },
        '/role/:id': (id) => {
          appModel.activePage(this.title);
          require(['role-details'], function () {
            appModel.componentParams = {
              model: appModel
            };
            appModel.currentRoleId(id);
            appModel.currentView('role-details');
          });
        },
      };
    }

    return routes;
  }
);