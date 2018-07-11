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