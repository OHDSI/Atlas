define(
  (require, exports) => {
	  const ko = require('knockout');  	
    const buildRoutes = require('./routes');
    const appState = require('atlas-state');
    const constants = require('./const');

    const statusCss = ko.pureComputed(function () {
      if (appState.predictionAnalysis.current()) {
        return appState.predictionAnalysis.dirtyFlag().isDirty() ? "unsaved" : "open";
      } 
      return "";
    });

    const navUrl = ko.pureComputed(function () {
      let url = constants.paths.browser();
      if (appState.predictionAnalysis.current()) {
        if (appState.predictionAnalysis.current().id() != null && appState.predictionAnalysis.current().id() > 0) {
          url = appState.predictionAnalysis.analysisPath(appState.predictionAnalysis.current().id());
        } else {
          url = constants.paths.createAnalysis();
        }
      }
      return url;
    });
  
    return {
      title: ko.i18n('navigation.prediction', 'Prediction'),
      buildRoutes,
      navUrl: navUrl,
      icon: 'heartbeat',
			statusCss: statusCss,
    };
  }
);