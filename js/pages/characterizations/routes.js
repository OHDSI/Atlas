define(
    (require, factory) => {
        function routes(appModel) {

            const characterizationViewEdit = function(id, section, subId) {
                appModel.activePage(this.title);
                require(['./components/characterizations/characterization-view-edit'], function () {
                    appModel.componentParams = {
                        model: appModel,
                        characterizationId: id,
                        section: section,
                        subId: subId,
                    };
                    appModel.currentView('characterization-view-edit');
                });
            };

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
                'cc/characterizations/:id:/:section:': characterizationViewEdit,
                'cc/characterizations/:id:/:section:/:subId:': characterizationViewEdit, // for executions
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