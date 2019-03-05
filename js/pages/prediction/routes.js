define(
	(require, factory) => {
    const { AuthorizedRoute } = require('pages/Route');
    const atlasState = require('atlas-state');
    function routes(appModel, router) {

      const predictionViewEdit = new AuthorizedRoute((analysisId, section) => {
        appModel.activePage(this.title);
        require([
          './prediction-manager', 
          './components/editors/evaluation-settings-editor',
          './components/editors/execution-settings-editor', 
          './components/editors/model-settings-editor', 
          './components/editors/population-settings-editor',
          './components/editors/prediction-covariate-settings-editor',
        ], function() {
          atlasState.predictionAnalysis.selectedId(analysisId);
          appModel.currentView('prediction-manager');
          router.setCurrentView('prediction-manager', {
            id: analysisId, 
            section: section || 'specification',
          });
        });
      });

      return {        
        '/prediction': new AuthorizedRoute(() => {
          appModel.activePage(this.title);
          require(['./prediction-browser'], function() {
            appModel.currentView('prediction-browser');
          })
        }),
        '/prediction/:analysisId:': predictionViewEdit,
        '/prediction/:analysisId:/:section:': predictionViewEdit,
      };
    }

    return routes;
  }
);