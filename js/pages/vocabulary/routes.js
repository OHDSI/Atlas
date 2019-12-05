define(
    (require, factory) => {
        const ko = require('knockout');
        const { AuthorizedRoute } = require('pages/Route');

		function routes(router) {

            const search = new AuthorizedRoute(() => {
                require(['./vocabulary'], function (search) {
                    const view = 'vocabulary';
                    let params = {
                        qs: router.qs()
                    };
                    router.setCurrentView(view, params);
                });
            });

            return {
                '/search': search
            };
        }

        return routes;
    }
);