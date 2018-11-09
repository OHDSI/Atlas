define(
	(require, factory) => {
        const ko = require('knockout');
        const { AuthorizedRoute } = require('pages/Route');

		function routes(appModel, router) {

            const search = new AuthorizedRoute((query) => {
                appModel.activePage(this.title);
                require(['./vocabulary'], function (search) {
                    const view = 'vocabulary';
                    let params = {
                        query:query ? unescape(query) : null,
                    };
                    router.setCurrentView(view, params);
                });
            });

			return {        
				'/search/:query:': search,
				'/search': search,
			};
		}

		return routes;
	}
);