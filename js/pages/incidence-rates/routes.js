define(
  (require, factory) => {
    const { AuthorizedRoute } = require('providers/Route');
    function routes(appModel) {
      return {        
        '/iranalysis': new AuthorizedRoute(() => {
          appModel.activePage(this.title);
          require(['./ir-browser'], function () {
            appModel.componentParams = {
              model: appModel
            };
            appModel.currentView('ir-browser');
          });
        }),
        '/iranalysis/new': new AuthorizedRoute((analysisId) => {
          appModel.activePage(this.title);
          require(['./ir-manager'], function () {
            appModel.selectedIRAnalysisId(null);
            appModel.componentParams = {
              model: appModel
            };
            appModel.currentView('ir-manager');
          });
        }),
        '/iranalysis/:analysisId:/?((\w|.)*)': new AuthorizedRoute((analysisId, path) => {
          appModel.activePage(this.title);
          path = path.split("/");
          var activeTab = null;
          if (path.length > 0 && path[0] != "") {
            activeTab = path[0];
          }
          require(['./ir-manager'], function () {
            appModel.selectedIRAnalysisId(+analysisId);
            appModel.componentParams = {
              model: appModel,
              activeTab: activeTab
            };
            appModel.currentView('ir-manager');
          });
        }),
      };
    }

    return routes;
  }
);