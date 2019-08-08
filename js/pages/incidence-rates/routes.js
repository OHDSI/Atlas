define(
	(require, factory) => {
    const { AuthorizedRoute } = require('pages/Route');
		const atlasState = require('atlas-state');
    function routes(appModel, router) {
      return {
        '/iranalysis': new AuthorizedRoute(() =>  {
          require(['./ir-browser'], () => {
            router.setCurrentView('ir-browser');
          });
        }),
        '/iranalysis/:analysisId:/?((\w|.)*)': new AuthorizedRoute((analysisId, path) => {
          analysisId = parseInt(analysisId);
          path = path.split("/");
          let activeTab = null;
          if (path.length > 0 && path[0] !== "") {
            activeTab = path[0];
          }
          require(['./ir-manager'], function () {
            atlasState.IRAnalysis.selectedId(+analysisId);
            router.setCurrentView('ir-manager', { analysisId, activeTab });
          });
        }),
      };
    }

    return routes;
  }
);