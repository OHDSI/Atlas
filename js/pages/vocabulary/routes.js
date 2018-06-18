define(
	(require, factory) => {
		function routes(appModel) {
			return {        
				'/search/:query:': (query) => {
					appModel.activePage(this.title);
					require(['./vocabulary'], function (search) {
						appModel.componentParams = {
							model: appModel,
							query: unescape(query)
						};
						appModel.currentView('vocabulary');
					});
				},
				'/search': () => {
					appModel.activePage(this.title);
					require(['./vocabulary'], function (search) {
						appModel.componentParams = {
							model: appModel
						};
						appModel.currentView('vocabulary');
					});
				},
			};
		}

		return routes;
	}
);