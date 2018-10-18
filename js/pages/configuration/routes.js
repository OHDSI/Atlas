define(
  (require, factory) => {
    const { AuthorizedRoute } = require('pages/Route');
    function routes(appModel, router) {
      return {
        '/configure': new AuthorizedRoute(() => {
          appModel.activePage(this.title);
          require(['./configuration', './sources/source-manager'], function () {
            router.setCurrentView('ohdsi-configuration');
          });
        }),
        '/roles': new AuthorizedRoute(() => {
          appModel.activePage(this.title);
          require(['./roles/roles'], function () {
            router.setCurrentView('roles');
          });
        }),
        '/role/:id': new AuthorizedRoute((id) => {
          appModel.activePage(this.title);
          require(['./roles/role-details'], function () {
            appModel.currentRoleId(id);
            router.setCurrentView('role-details');
          });
        }),
        'import': new AuthorizedRoute(() => {
          appModel.activePage(this.title);
          require(['./users-import/users-import'], function() {
            router.setCurrentView('users-import');
          });
        }),
        '/source/:id': new AuthorizedRoute((id) => {
          appModel.activePage(this.title);
          require(['./sources/source-manager'], function () {
            appModel.selectedSourceId(id !== 'new' ? id : null);
            router.setCurrentView('source-manager');
          });
        }),
      };
    }

    return routes;
  }
);