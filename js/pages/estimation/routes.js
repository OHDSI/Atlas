define((require, factory) => {
  const { AuthorizedRoute } = require('pages/Route');
  const atlasState = require('atlas-state');
    function routes(router) {

      const ccaViewEdit = new AuthorizedRoute((estimationId, section, generationId) => {
        require(['./cca-manager'], function () {
          atlasState.estimationAnalysis.selectedId(estimationId);
          router.setCurrentView('cca-manager', {
            id: estimationId,
            generationId: generationId,  
            section: section || 'specification',
          });
        });
      });

      return {
        '/estimation': new AuthorizedRoute(() => {
          require(['./estimation-browser'], function () {
            router.setCurrentView('estimation-browser');
          });
        }),
        '/estimation/cca/:estimationId:': ccaViewEdit,
        '/estimation/cca/:estimationId:/:section:': ccaViewEdit,
        '/estimation/cca/:estimationId:/:section:/:generationId:': ccaViewEdit,
      };
    }

    return routes;
  }
);