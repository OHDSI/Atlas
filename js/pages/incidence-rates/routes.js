define(
	[
    'pages/Route',
    'atlas-state',
	],
	({ AuthorizedRoute }, atlasState) => {
    function routes(appModel, router) {
      return {        
        '/iranalysis': new AuthorizedRoute(() => {
          appModel.activePage(this.title);
          require(['pages/incidence-rates/ir-browser'], function () {
            router.setCurrentView('ir-browser');
          });
        }),
        '/iranalysis/new': new AuthorizedRoute((analysisId) => {
          appModel.activePage(this.title);
          require(['pages/incidence-rates/ir-manager'], function () {
            atlasState.IRAnalysis.selectedId(null);
            router.setCurrentView('ir-manager');
          });
        }),
        '/iranalysis/:analysisId:/?((\w|.)*)': new AuthorizedRoute((analysisId, path) => {
          appModel.activePage(this.title);
          path = path.split("/");
          var activeTab = null;
          if (path.length > 0 && path[0] != "") {
            activeTab = path[0];
          }
          require(['pages/incidence-rates/ir-manager'], function () {
            atlasState.IRAnalysis.selectedId(+analysisId);
            router.setCurrentView('ir-manager');
          });
        }),
      };
    }

    return routes;
  }
);