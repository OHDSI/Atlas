define(
  (require, factory) => {
    function routes(appModel) {
      return {        
        '/iranalysis': () => {
          appModel.activePage(this.title);
          require(['ir-browser'], function () {
            appModel.componentParams = {
              model: appModel
            };
            appModel.currentView('ir-browser');
          });
        },
        '/iranalysis/new': (analysisId) => {
          appModel.activePage(this.title);
          require(['ir-manager'], function () {
            appModel.selectedIRAnalysisId(null);
            appModel.componentParams = {
              model: appModel
            };
            appModel.currentView('ir-manager');
          });
        },
        '/iranalysis/:analysisId:/?((\w|.)*)': (analysisId, path) => {
          appModel.activePage(this.title);
          path = path.split("/");
          var activeTab = null;
          if (path.length > 0 && path[0] != "") {
            activeTab = path[0];
          }
          require(['ir-manager'], function () {
            appModel.selectedIRAnalysisId(+analysisId);
            appModel.componentParams = {
              model: appModel,
              activeTab: activeTab
            };
            appModel.currentView('ir-manager');
          });
        },
      };
    }

    return routes;
  }
);