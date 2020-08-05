define((require, factory) => {
  const { AuthorizedRoute } = require('pages/Route');
  const atlasState = require('atlas-state');
    function routes(router) {

      const ccaViewEdit = new AuthorizedRoute((estimationId, section, sourceId) => {
        require(['./cca-manager'], function () {
          atlasState.estimationAnalysis.selectedId(estimationId);
          router.setCurrentView('cca-manager', {
            id: estimationId,
            section: section || 'specification',
            sourceId: section === 'executions' ? sourceId : null,
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
        '/estimation/cca/:estimationId:/:section:/:sourceId:': ccaViewEdit,
      };
    }

    return routes;
  }
);