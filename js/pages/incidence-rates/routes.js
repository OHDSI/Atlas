define(
	(require, factory) => {
    const { AuthorizedRoute } = require('pages/Route');
		const atlasState = require('atlas-state');
    function routes(appModel, router) {
      return {        
        '/iranalysis': new AuthorizedRoute(() => {
          appModel.activePage(this.title);
          require(['./ir-browser'], function () {
            router.setCurrentView('ir-browser');
          });
        }),
        '/iranalysis/new': new AuthorizedRoute((analysisId) => {
          appModel.activePage(this.title);
          require(['./ir-manager'], function () {
            atlasState.IRAnalysis.selectedId(null);
            router.setCurrentView('ir-manager', {});
          });
        }),
        '/iranalysis/:analysisId:/?((\w|.)*)': new AuthorizedRoute((analysisId, path) => {
          appModel.activePage(this.title);
          path = path.split("/");
          var activeTab = null;
          if (path.length > 0 && path[0] !== "") {
            activeTab = path[0];
          }
          require(['./ir-manager'], function () {
            atlasState.IRAnalysis.selectedId(+analysisId);
            router.setCurrentView('ir-manager', { analysisId });
          });
        }),
      };
    }

    return routes;
  }
);