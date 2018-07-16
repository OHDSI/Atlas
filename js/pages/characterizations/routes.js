define(
    (require, factory) => {
        function routes(appModel) {
            return {
                'cc/characterizations': () => {
                    appModel.activePage(this.title);
                    require(['./components/characterizations/characterizations-list'], function () {
                        appModel.componentParams = {
                            model: appModel
                        };
                        appModel.currentView('characterizations-list');
                    });
                },
                'cc/characterizations/:id:/:section:': (id, section) => {
                    appModel.activePage(this.title);
                    require(['./components/characterizations/characterization-view-edit'], function () {
                        appModel.componentParams = {
                            model: appModel,
                            characterizationId: id,
                            section: section
                        };
                        appModel.currentView('characterization-view-edit');
                    });
                },
                'cc/feature-analyses': () => {
                    appModel.activePage(this.title);
                    require(['./components/feature-analyses/feature-analyses-list'], function () {
                        appModel.componentParams = {
                            model: appModel
                        };
                        appModel.currentView('feature-analyses-list');
                    });
                },
            };
        }

        return routes;
    }
);