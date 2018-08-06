define(
  (require, factory) => {
    const { AuthorizedRoute } = require('providers/Route');
    function routes(appModel) {
      return {
        '/configure': new AuthorizedRoute(() => {
          appModel.activePage(this.title);
          require(['configuration', 'source-manager'], function () {
            appModel.currentView('ohdsi-configuration');
          });
        }),
        '/roles': new AuthorizedRoute(() => {
          appModel.activePage(this.title);
          require(['roles'], function () {
            appModel.currentView('roles');
          });
        }),
        '/role/:id': new AuthorizedRoute((id) => {
          appModel.activePage(this.title);
          require(['role-details'], function () {
            appModel.currentRoleId(id);
            appModel.currentView('role-details');
          });
        }),
        '/source/:id': new AuthorizedRoute((id) => {
          appModel.activePage(this.title);
          require(['source-manager'], function () {
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