define(
	[
		'pages/Route'
	],
	({ AuthorizedRoute }) => {

	// return the routes that #/pathways responds to
	function routes(appModel, router) {

		const pathwaysManager = new AuthorizedRoute((id, section, subId) => {
			appModel.activePage(this.title);
			require(['pages/pathways/components/manager'], function () {
				router.setCurrentView('pathways-manager', {
					analysisId: id,
					section: section,
					subId: subId
				});
			});
		});

		const pathwaysBrowser = new AuthorizedRoute(() => {
			appModel.activePage(this.title);
			require(['pages/pathways/components/browser'], function () {
				router.setCurrentView('pathways-browser');
			});
		})
		
		return {
			'pathways': pathwaysBrowser,
			'pathways/:id:': pathwaysManager,
			'pathways/:id:/:section:': pathwaysManager,
			'pathways/:id:/:section:/:subId:': pathwaysManager // for executions
		};
	}

	return routes;
});
