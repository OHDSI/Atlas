define(
	(require, factory) => {
        const ko = require('knockout');
        const { Route } = require('providers/Route');

		function routes(appModel, router) {

            const search = new Route((query) => {
                appModel.activePage(this.title);
                require(['./vocabulary'], function (search) {
                    const view = 'vocabulary';
                    let params = undefined;

                    if (appModel.currentView() !== view) {
                        params = {
                            query: ko.observable(query ? unescape(query) : null),
                        };
                    }

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