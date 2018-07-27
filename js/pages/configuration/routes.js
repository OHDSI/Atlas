define(
  (require, factory) => {
    function routes(appModel) {
      return {
        '/configure': () => {
          appModel.activePage(this.title);
          require(['./configuration', './sources/source-manager'], function () {
            appModel.componentParams = {
              model: appModel
            };
            appModel.currentView('ohdsi-configuration');
          });
        },
        '/roles': () => {
          appModel.activePage(this.title);
          require(['./roles/roles'], function () {
            appModel.componentParams = {
              model: appModel
            };
            appModel.currentView('roles');
          });
        },
        '/role/:id': (id) => {
          appModel.activePage(this.title);
          require(['./roles/role-details'], function () {
            appModel.componentParams = {
              model: appModel
            };
            appModel.currentRoleId(id);
            appModel.currentView('role-details');
          });
        },
        'import': () => {
          appModel.activePage(this.title);
          require(['./users-import/users-import'], function() {
            appModel.componentParams = {
              model: appModel,
            };
            appModel.currentView('users-import');
          });
        }
      };
    }

    return routes;
  }
);