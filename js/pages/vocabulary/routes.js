define(
	[
		'pages/Route'
	],
	({ AuthorizedRoute }) => {

		function routes(appModel, router) {

            const search = new AuthorizedRoute((query) => {
                appModel.activePage(this.title);
                require(['pages/vocabulary/vocabulary'], function (search) {
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