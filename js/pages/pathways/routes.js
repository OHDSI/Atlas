define((require, factory) => {
	const ko = require('knockout');
	const {
		AuthorizedRoute
	} = require('pages/Route');

	// return the routes that #/pathways responds to
	function routes(router) {

		const pathwaysManager = new AuthorizedRoute((id, section, subId) => {
			require(['./components/manager'], function () {
				router.setCurrentView('pathways-manager', {
					analysisId: id,
					section: section,
					executionId: section === 'results' ? subId : undefined,
					sourceId:  section === 'executions' ? subId : undefined,
				});
			});
		});

		const pathwaysBrowser = new AuthorizedRoute(() => {
			require(['./components/browser'], function () {
				router.setCurrentView('pathways-browser');
			});
		})

		return {
			'pathways': pathwaysBrowser,
			'pathways/:id:': pathwaysManager,
			'pathways/:id:/:section:': pathwaysManager,
			'pathways/:id:/:section:/:subId:': pathwaysManager
		};
	}

	return routes;
});
