define(
	[
		'pages/Route'
	],
	({ AuthorizedRoute }) => {
    function routes(appModel, router) {
      const JobViewEdit = new AuthorizedRoute((id, section) => {
				appModel.activePage(this.title);
				require(['pages/configuration/users-import/job-view-edit'], function () {
					router.setCurrentView('import-job-view-edit', {
						jobId: id,
						section: section,
					});
				});
			});
      return {
        '/configure': new AuthorizedRoute(() => {
          appModel.activePage(this.title);
          require(['pages/configuration/configuration', 'pages/configuration/sources/source-manager'], function () {
            router.setCurrentView('ohdsi-configuration');
          });
        }),
        '/roles': new AuthorizedRoute(() => {
          appModel.activePage(this.title);
          require(['pages/configuration/roles/roles'], function () {
            router.setCurrentView('roles');
          });
        }),
        '/role/:id': new AuthorizedRoute((id) => {
          appModel.activePage(this.title);
          require(['pages/configuration/roles/role-details'], function () {
            appModel.currentRoleId(id);
            router.setCurrentView('role-details');
          });
        }),
        'import' : new AuthorizedRoute(() => {
          appModel.activePage(this.title);
          require(['pages/configuration/users-import/browser'], function () {
            router.setCurrentView('user-import-browser');
					});
        }),
        'import/job/:id:' : JobViewEdit,
        'import/job/:id:/:section:': JobViewEdit,
        'import/wizard': new AuthorizedRoute(() => {
          appModel.activePage(this.title);
          require(['pages/configuration/users-import/users-import'], function() {
            router.setCurrentView('users-import');
          });
        }),
        '/source/:id': new AuthorizedRoute((id) => {
          appModel.activePage(this.title);
          require(['pages/configuration/sources/source-manager'], function () {
            appModel.selectedSourceId(id !== 'new' ? id : null);
            router.setCurrentView('source-manager');
          });
        }),
      };
    }

    return routes;
  }
);