define(
    (require, factory) => {
        function routes(appModel) {
            return {
                'cc/characterizations': () => {
                    appModel.activePage(this.title);
                    require(['./components/characterizations'], function () {
                        appModel.componentParams = {
                            model: appModel
                        };
                        appModel.currentView('characterizations');
                    });
                },
                'cc/characterizations/:id:': (id) => {
                    appModel.activePage(this.title);
                    require(['./components/characterization-view-edit'], function (id) {
                        appModel.componentParams = {
                            model: appModel,
                            characterizationId: unescape(id)
                        };
                        appModel.currentView('characterization-view-edit');
                    });
                },
                'cc/feature-analyses': () => {
                    appModel.activePage(this.title);
                    require(['./components/feature-analyses'], function () {
                        appModel.componentParams = {
                            model: appModel
                        };
                        appModel.currentView('feature-analyses');
                    });
                },
            };
        }

        return routes;
    }
);