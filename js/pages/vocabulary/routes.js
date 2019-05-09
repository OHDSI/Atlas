define(
    (require, factory) => {
        const ko = require('knockout');
        const { AuthorizedRoute } = require('pages/Route');

        function routes(appModel, router) {

            const search = new AuthorizedRoute(() => {
                appModel.activePage(this.title);
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