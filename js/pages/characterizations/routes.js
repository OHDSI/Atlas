define(
	(require, factory) => {
		const ko = require('knockout');
	   const {
		   AuthorizedRoute
	   } = require('pages/Route');
	   require('./components/characterizations/characterization-view-edit');

		function routes(router) {

            const characterizationViewEdit = new AuthorizedRoute((id, section, subId) => {
                router.setCurrentView('characterization-view-edit', {
                    characterizationId: id,
                    section: section || 'design',
					executionId: section === 'results' ? subId : null,
					sourceId:  section === 'executions' ? subId : null,
                });
            });

			return {
				'cc/characterizations': new AuthorizedRoute(() => {
					require(['./components/characterizations/characterizations-list'], function () {
						router.setCurrentView('characterizations-list');
					});
				}),
				'cc/characterizations/:id:': characterizationViewEdit,
				'cc/characterizations/:id:/:section:': characterizationViewEdit,
				'cc/characterizations/:id:/:section:/:subId:': characterizationViewEdit, // for executions
				'cc/feature-analyses': new AuthorizedRoute(() => {
					require(['./components/feature-analyses/feature-analyses-list'], function () {
						router.setCurrentView('feature-analyses-list');
					});
				}),
				'cc/feature-analyses/:id:': new AuthorizedRoute((id) => {
					require(['./components/feature-analyses/feature-analysis-view-edit'], function () {
						router.setCurrentView('feature-analysis-view-edit', { id });
					});
				}),
			};
		}

		return routes;
	}
);
