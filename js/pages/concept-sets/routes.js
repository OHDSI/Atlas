define(
  (require, factory) => {
    function routes(appModel) {
      return {        
        '/conceptset/:conceptSetId/:mode': (conceptSetId, mode) => {
          appModel.activePage(this.title);
          require(['conceptset-manager', 'cohort-definition-browser', 'conceptset-list-modal'], function () {
            appModel.componentParams = {
              model: appModel
            };
            appModel.loadConceptSet(conceptSetId, 'conceptset-manager', 'repository', mode);
          });
        },
        '/conceptsets': () => {
          appModel.activePage(this.title);
          require(['conceptset-browser'], function () {
            appModel.componentParams = {
              model: appModel
            };
            appModel.currentView('conceptset-browser');
          });
        },
        '/concept/:conceptId:': (conceptId) => {
          appModel.activePage(this.title);
          require(['concept-manager'], function () {
            appModel.currentConceptId(conceptId);
            appModel.componentParams = {
              model: appModel
            };
            appModel.currentView('concept-manager');
          });
        },
      };
    }

    return routes;
  }
);