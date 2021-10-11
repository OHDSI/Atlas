define((require) => {
	const {
		AuthorizedRoute
	} = require('pages/Route');

	function routes(router) {

		const reusablesManager = new AuthorizedRoute((id, section) => {
			require(['./components/manager'], function () {
				router.setCurrentView('reusables-manager', {
					designId: id,
					section: section,
				});
			});
		});

		const reusablesManagerVersion = new AuthorizedRoute((id, version) => {
			require(['./components/manager'], function () {
				router.setCurrentView('reusables-manager', {
					designId: id,
					section: 'design',
					version: version
				});
			});
		});

		const reusablesBrowser = new AuthorizedRoute(() => {
			require(['./components/browser'], function () {
				router.setCurrentView('reusables-browser');
			});
		})

		return {
			'reusables': reusablesBrowser,
			'reusables/:id:': reusablesManager,
			'reusables/:id:/version/:version:': reusablesManagerVersion,
			'reusables/:id:/:section:': reusablesManager,
			'reusables/:id:/:section:/:subId:': reusablesManager // for executions
		};
	}

	return routes;
});
