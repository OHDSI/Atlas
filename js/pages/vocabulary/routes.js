define(
    (require, factory) => {
        const ko = require('knockout');
        const { AuthorizedRoute } = require('pages/Route');

		function routes(router) {

            const search = new AuthorizedRoute(() => {
                require(['./vocabulary'], function (search) {
                    const view = 'vocabulary';
                    let params = {
                        query: router.qs().query ? unescape(router.qs().query) : null,
                    };
                    router.setCurrentView(view, params);
                });
            });

            const legacySearch = new AuthorizedRoute((query) => {
                window.location = '#/search?query=' + query;
            });

            return {
                'search/:query:': legacySearch,
                '/search': search, 
                'search':search,
            };
        }

        return routes;
    }
);