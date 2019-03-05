define((require, factory) => {
  const { AuthorizedRoute } = require('pages/Route');
  const atlasState = require('atlas-state');
    function routes(appModel, router) {

      const ccaViewEdit = new AuthorizedRoute((estimationId, section) => {
        appModel.activePage(this.title);
        require(['./cca-manager'], function () {
          atlasState.estimationAnalysis.selectedId(estimationId);
          router.setCurrentView('cca-manager', {
            id: estimationId, 
            section: section || 'specification',
          });
        });
      });

      return {
        '/estimation': new AuthorizedRoute(() => {
          appModel.activePage(this.title);
          require(['./estimation-browser'], function () {
            router.setCurrentView('estimation-browser');
          });
        }),
        '/estimation/cca/:estimationId:': ccaViewEdit,
        '/estimation/cca/:estimationId:/:section:': ccaViewEdit,
      };
    }

    return routes;
  }
);