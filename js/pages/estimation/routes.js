define((require, factory) => {
  const { AuthorizedRoute } = require('pages/Route');
  const atlasState = require('atlas-state');
    function routes(router) {

      const ccaViewEdit = new AuthorizedRoute((estimationId, section, sourceId, executionId) => {
        require(['./cca-manager'], function () {
          atlasState.estimationAnalysis.selectedId(estimationId);
          atlasState.estimationAnalysis.notificationSourceId(sourceId);
          atlasState.estimationAnalysis.notificationExecutionId(executionId);
          router.setCurrentView('cca-manager', {
            id: estimationId,
            section: section || 'specification',
            sourceId,
            executionId,
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
        '/estimation/cca/:estimationId:/:section:/:sourceId:/:executionId:': ccaViewEdit,
      };
    }

    return routes;
  }
);