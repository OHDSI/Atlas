define(
  (require, exports) => {
    const ko = require('knockout');
    const appState = require('atlas-state');
    const buildRoutes = require('./routes');
    const constants = require('./const');

    const statusCss = ko.pureComputed(() => {
      if (appState.ConceptSet.current()) {
        return appState.ConceptSet.dirtyFlag().isDirty() ? 'unsaved' : 'open';
      }
      return '';
    });

    const navUrl = ko.pureComputed(function () {
      let url = "#/conceptsets";
      if (appState.ConceptSet.current()) {
        url = `#${constants.paths.mode(appState.ConceptSet.current().id || 0)}`;
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