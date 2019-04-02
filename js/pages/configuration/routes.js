define(
	(require, factory) => {
    const { AuthorizedRoute } = require('pages/Route');
    function routes(appModel, router) {
      const JobViewEdit = new AuthorizedRoute((id, section) => {
				appModel.activePage(this.title);
				require(['./users-import/job-view-edit'], function () {
					router.setCurrentView('import-job-view-edit', {
						jobId: id,
						section: section,
					});
				});
			});
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
            router.setCurrentView('role-details', {
              roleId: id,
            });
          });
        }),
        'import' : new AuthorizedRoute(() => {
          appModel.activePage(this.title);
          require(['./users-import/browser'], function () {
            router.setCurrentView('user-import-browser');
					});
        }),
        'import/job/:id:' : JobViewEdit,
        'import/job/:id:/:section:': JobViewEdit,
        'import/wizard': new AuthorizedRoute(() => {
          appModel.activePage(this.title);
          require(['./users-import/users-import'], function() {
            router.setCurrentView('users-import');
          });
        }),
        'import/roles': new AuthorizedRoute(() => {
          appModel.activePage(this.title);
          require(['./roles/role-import'], function() {
            router.setCurrentView('role-import');
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