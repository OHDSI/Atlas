define(
	(require, factory) => {
    const { AuthorizedRoute } = require('pages/Route');
    const atlasState = require('atlas-state');
    function routes(router) {

      const predictionViewEdit = new AuthorizedRoute((analysisId, section, subSection) => {
        require([
          './prediction-manager',
          './components/editors/evaluation-settings-editor',
          './components/editors/execution-settings-editor',
          './components/editors/model-settings-editor',
          './components/editors/population-settings-editor',
          './components/editors/prediction-covariate-settings-editor',
        ], function() {
          atlasState.predictionAnalysis.selectedId(analysisId);
          router.setCurrentView('prediction-manager', {
            id: analysisId,
            section: section || 'specification',
            subSection: subSection,
          });
        });
      });

      return {
        '/prediction': new AuthorizedRoute(() => {
          require(['./prediction-browser'], function() {
            router.setCurrentView('prediction-browser');
          })
        }),
        '/prediction/:analysisId:': predictionViewEdit,
        '/prediction/:analysisId:/:section:': predictionViewEdit,
        '/prediction/:analysisId:/:section:/:subSection:': predictionViewEdit,
      };
    }

    return routes;
  }
);