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
            section: section || 'specification',
          });
        });
      });

      return {        
        '/plp': new AuthorizedRoute(() => {
          appModel.activePage(this.title);
          require(['./plp-browser'], function () {
            router.setCurrentView('plp-browser');
          });
        }),
        '/plp/:modelId:': new AuthorizedRoute((modelId) => {
          appModel.activePage(this.title);
          require([
            './plp-manager',
            './components/plp-inspector',
            './components/plp-roc',
            './components/plp-calibration',
            './components/plp-spec-editor',
            './components/plp-r-code',
            './components/plp-print-friendly',
            'components/cohort-definition-browser',
            'components/atlas.cohort-editor'
          ], function () {
            atlasState.predictionAnalysis.selectedId(+modelId);
            router.setCurrentView('plp-manager');
          });
        }),
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