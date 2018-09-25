define(
  (require, factory) => {
    const { AuthorizedRoute } = require('providers/Route');
    function routes(appModel) {
      return {
        '/configure': new AuthorizedRoute(() => {
          appModel.activePage(this.title);
          require(['./configuration', './sources/source-manager'], function () {
            appModel.currentView('ohdsi-configuration');
          });
        }),
        '/roles': new AuthorizedRoute(() => {
          appModel.activePage(this.title);
          require(['./roles/roles'], function () {
            appModel.currentView('roles');
          });
        }),
        '/role/:id': new AuthorizedRoute((id) => {
          appModel.activePage(this.title);
          require(['./roles/role-details'], function () {
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
            appModel.selectedSourceId(id !== 'new' ? id : null);
            appModel.currentView('source-manager');
          });
        }),
      };
    }

    return routes;
  }
);