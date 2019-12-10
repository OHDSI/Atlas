define(
  (require, exports) => {
    const ko = require('knockout');
    const buildRoutes = require('./routes');
    const appState = require('atlas-state');
    const constants = require('./const');

    const statusCss = ko.pureComputed(function () {
      if (appState.estimationAnalysis.current())
        return appState.estimationAnalysis.dirtyFlag().isDirty() ? "unsaved" : "open";
      return "";
    });

    const navUrl = ko.pureComputed(function () {
      let url = constants.paths.browser();
      if (appState.estimationAnalysis.current()) {
        if (appState.estimationAnalysis.current().id() != null && appState.estimationAnalysis.current().id() > 0) {
          url = appState.estimationAnalysis.analysisPath(appState.estimationAnalysis.current().id());
        } else {
          url = constants.paths.createCcaAnalysis();
        }  
      }
      return url;
    });
 
    return {
      title: ko.i18n('navigation.estimation', 'Estimation'),
      buildRoutes,
      navUrl: navUrl,
      icon: 'balance-scale', 
      statusCss: statusCss
    };
  }
);