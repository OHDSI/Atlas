define(
  (require, factory) => {
    function routes(appModel) {
      const { AuthorizedRoute } = require('providers/Route');
      return {        
        '/plp': new AuthorizedRoute(() => {
          appModel.activePage(this.title);
          require(['plp-browser', 'plp-manager', 'plp-inspector'], function () {
            appModel.currentView('plp-browser');
          });
        }),
        '/plp/:modelId:': new AuthorizedRoute((modelId) => {
          appModel.activePage(this.title);
          require(['plp-manager', 'plp-inspector', 'plp-roc', 'plp-calibration', 'plp-spec-editor', 'plp-r-code', 'plp-print-friendly', 'components/cohort-definition-browser', 'components/atlas.cohort-editor'], function () {
            appModel.currentPatientLevelPredictionId(+modelId);
            appModel.componentParams = {
              currentPatientLevelPredictionId: appModel.currentPatientLevelPredictionId,
              currentPatientLevelPrediction: appModel.currentPatientLevelPrediction,
              dirtyFlag: appModel.currentPatientLevelPredictionDirtyFlag,
            };
            appModel.currentView('plp-manager');
          });
        }),
      };
    }

    return routes;
  }
);