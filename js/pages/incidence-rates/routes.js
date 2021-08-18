define(
	(require, factory) => {
    const { AuthorizedRoute } = require('pages/Route');
		const atlasState = require('atlas-state');
    function routes(router) {
      return {
        '/iranalysis': new AuthorizedRoute(() =>  {
          require(['./ir-browser'], () => {
            router.setCurrentView('ir-browser');
          });
        }),
        '/iranalysis/:analysisId:/version/:version:': new AuthorizedRoute((analysisId, version) =>  {
          require(['./ir-manager'], () => {
            atlasState.IRAnalysis.selectedId(+analysisId);
            router.setCurrentView('ir-manager', { analysisId, activeTab: 'definition', version });
          });
        }),
        '/iranalysis/:analysisId:/?((\w|.)*)': new AuthorizedRoute((analysisId, path) => {
          analysisId = parseInt(analysisId);
          path = path.split("/");
          let activeTab = null;
          if (path.length > 0 && path[0] !== "") {
            activeTab = path[0];
          }
          let selectedSourceId = null;
          // source_id
          if (path.length > 1 && path[1] !== "") { 
            selectedSourceId = parseInt(path[1]);
          }
          require(['./ir-manager'], function () {
            atlasState.IRAnalysis.selectedId(+analysisId);
            atlasState.IRAnalysis.selectedSourceId(+selectedSourceId);
            router.setCurrentView('ir-manager', { analysisId, activeTab });
          });
        }),
      };
    }

    return routes;
  }
);