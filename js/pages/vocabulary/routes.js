define(
	(require, factory) => {
    const { Route } = require('providers/Route');
		function routes(appModel) {
			return {        
				'/search/:query:': new Route((query) => {
					appModel.activePage(this.title);
					require(['./vocabulary'], function (search) {
						appModel.componentParams({
							query: unescape(query)
						});
						appModel.currentView('vocabulary');
					});
				}),
				'/search': new Route(() => {
					appModel.activePage(this.title);
					require(['./vocabulary'], function (search) {
						appModel.currentView('vocabulary');
					});
				}),
			};
		}

		return routes;
	}
);