define(
  (require, factory) => {
    function routes(appModel, router) {
      const { AuthorizedRoute } = require('pages/Route');
      const atlasState = require('atlas-state');		
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
            appModel.currentPatientLevelPredictionId(+modelId);
            const params = {};
            params.currentPatientLevelPredictionId = appModel.currentPatientLevelPredictionId();
            params.currentPatientLevelPrediction = appModel.currentPatientLevelPrediction();
            params.dirtyFlag = appModel.currentPatientLevelPredictionDirtyFlag();

            router.setCurrentView('plp-manager', params);
          });
        }),
        '/prediction/:analysisId:': new AuthorizedRoute((analysisId) => {
          appModel.activePage(this.title);
          require([
            './prediction-manager', 
            './components/EvaluationSettingsEditor',
            './components/ExecutionSettingsEditor', 
            './components/ModelSettingsEditor', 
            './components/PopulationSettingsEditor',
            './components/PredictionCovariateSettingsEditor',
          ], function () {
            atlasState.predictionAnalysis.selectedId(analysisId);
            appModel.currentView('prediction-manager');
          });
        }),
        '/prediction': new AuthorizedRoute(() => {
          appModel.activePage(this.title);
          require(['./prediction-browser'], function() {
            appModel.currentView('prediction-browser');
          })
        }),
      };
    }

    return routes;
  }
);