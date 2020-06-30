define(
  (require, exports) => {
    const ko = require('knockout');
    const appState = require('atlas-state');
    const buildRoutes = require('./routes');
    const constants = require('./const');

    const statusCss = ko.pureComputed(() => {
      if (appState.repositoryConceptSet.current()) {
        return appState.repositoryConceptSet.dirtyFlag().isDirty() ? 'unsaved' : 'open';
      }
      return '';
    });

    const navUrl = ko.pureComputed(function () {
      let url = "#/conceptsets";
      if (appState.repositoryConceptSet.current()) {
        url = `#${constants.paths.mode(appState.repositoryConceptSet.current().id || 0)}`;
      }
      return url;
    });

    return {
      title: 'Concept Sets',
      buildRoutes,
      navUrl,
      icon: 'shopping-cart',
			statusCss,
    };
  }
);