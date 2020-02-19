define(
  (require, exports) => {
    const ko = require('knockout');
    const appState = require('atlas-state');
    const buildRoutes = require('./routes');
    const constants = require('./const');

    const statusCss = ko.pureComputed(() => {
      if (appState.CohortDefinition.current()) {
        return appState.CohortDefinition.dirtyFlag().isDirty() ? 'unsaved' : 'open';
      }
      return '';
    });

    const navUrl = ko.pureComputed(function () {
      let url = "#/cohortdefinitions";
      if (appState.CohortDefinition.current()) {
        url = `#${constants.paths.details(appState.CohortDefinition.current().id() || 0)}`;
      }
      return url;
    });

    return {
      title: ko.i18n('navigation.cohortdefinitions', 'Cohort Definitions'),
      buildRoutes,
      navUrl,
      icon: 'users',
      statusCss,
    };
  }
);