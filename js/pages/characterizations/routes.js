define(
    (require, factory) => {

        const ko = require('knockout');

        function routes(appModel) {

            const characterizationViewEdit = function(id, section, subId) {
                appModel.activePage(this.title);
                require(['./components/characterizations/characterization-view-edit'], function () {
                    const view = 'characterization-view-edit';
                    if (appModel.currentView() !== view) {
                        appModel.componentParams = {
                            model: appModel,
                            characterizationId: ko.observable(),
                            section: ko.observable(),
                            subId: ko.observable(),
                        };
                    }

                    appModel.componentParams.section(section);
                    appModel.componentParams.characterizationId(id);
                    appModel.componentParams.subId(subId);

                    appModel.currentView(view);
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