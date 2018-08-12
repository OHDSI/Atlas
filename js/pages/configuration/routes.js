define(
  (require, factory) => {
    const { AuthorizedRoute } = require('providers/Route');
    function routes(appModel) {
      return {
        '/configure': new AuthorizedRoute(() => {
          appModel.activePage(this.title);
          require(['./configuration', './sources/source-manager'], function () {
            appModel.componentParams = {
              model: appModel
            };
            appModel.currentView('ohdsi-configuration');
          });
        }),
        '/roles': new AuthorizedRoute(() => {
          appModel.activePage(this.title);
          require(['./roles/roles'], function () {
            appModel.componentParams = {
              model: appModel
            };
            appModel.currentView('roles');
          });
        }),
        '/role/:id': new AuthorizedRoute((id) => {
          appModel.activePage(this.title);
          require(['./roles/role-details'], function () {
            appModel.componentParams = {
              model: appModel
            };
            appModel.currentRoleId(id);
            appModel.currentView('role-details');
          });
        }),
        'import': new AuthorizedRoute(() => {
          appModel.activePage(this.title);
          require(['./users-import/users-import'], function() {
            appModel.componentParams = {
              model: appModel,
            };
            appModel.currentView('users-import');
          });
        }),
        '/source/:id': new AuthorizedRoute((id) => {
          appModel.activePage(this.title);
          require(['./sources/source-manager'], function () {
            appModel.componentParams = {
              model: appModel,
            };
            if (id !== 'new') {
              appModel.selectedSourceId(id);
            }
            appModel.currentView('source-manager');
          });
        }),
      };
    }

    return routes;
  }
);