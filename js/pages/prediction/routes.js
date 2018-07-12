define(
  (require, factory) => {
    function routes(appModel) {
      return {        
        '/plp': () => {
          appModel.activePage(this.title);
          require(['plp-browser', 'plp-manager', 'plp-inspector'], function () {
            appModel.componentParams = {
              model: appModel
            };
            appModel.currentView('plp-browser');
          });
        },
        '/plp/:modelId:': (modelId) => {
          appModel.activePage(this.title);
          require(['plp-manager', 'plp-inspector', 'plp-roc', 'plp-calibration', 'plp-spec-editor', 'plp-r-code', 'plp-print-friendly', 'components/cohort-definitions/cohort-definition-browser', 'components/atlas.cohort-editor'], function () {
            appModel.currentPatientLevelPredictionId(+modelId);
            appModel.componentParams = {
              model: appModel,
              currentPatientLevelPredictionId: appModel.currentPatientLevelPredictionId,
              currentPatientLevelPrediction: appModel.currentPatientLevelPrediction,
              dirtyFlag: appModel.currentPatientLevelPredictionDirtyFlag,
            };
            appModel.currentView('plp-manager');
          });
        },
      };
    }

    return routes;
  }
);