define(
	[
    'pages/Route',
    'atlas-state',
	],
	({ AuthorizedRoute }, atlasState) => {
    function routes(appModel, router) {
      return {        
        '/plp': new AuthorizedRoute(() => {
          appModel.activePage(this.title);
          require(['pages/prediction/plp-browser'], function () {
            router.setCurrentView('plp-browser');
          });
        }),
        '/plp/:modelId:': new AuthorizedRoute((modelId) => {
          appModel.activePage(this.title);
          require([
            'pages/prediction/plp-manager',
            'pages/prediction/components/plp-inspector',
            'pages/prediction/components/plp-roc',
            'pages/prediction/components/plp-calibration',
            'pages/prediction/components/plp-spec-editor',
            'pages/prediction/components/plp-r-code',
            'pages/prediction/components/plp-print-friendly',
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
            'pages/prediction/prediction-manager', 
            'pages/prediction/components/EvaluationSettingsEditor',
            'pages/prediction/components/ExecutionSettingsEditor', 
            'pages/prediction/components/ModelSettingsEditor', 
            'pages/prediction/components/PopulationSettingsEditor',
            'pages/prediction/components/PredictionCovariateSettingsEditor',
          ], function () {
            atlasState.predictionAnalysis.selectedId(analysisId);
            appModel.currentView('prediction-manager');
          });
        }),
        '/prediction': new AuthorizedRoute(() => {
          appModel.activePage(this.title);
          require(['pages/prediction/prediction-browser'], function() {
            appModel.currentView('prediction-browser');
          })
        }),
      };
    }

    return routes;
  }
);