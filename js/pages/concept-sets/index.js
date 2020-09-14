define(
  (require, exports) => {
    const ko = require('knockout');
    const appState = require('atlas-state');
    const buildRoutes = require('./routes');
    const constants = require('./const');
		const globalConstants = require('const');
		const conceptSetStore = require('components/conceptset/ConceptSetStore')

    const statusCss = ko.pureComputed(() => {
      if (appState.RepositoryConceptSet.current()) {
        return appState.RepositoryConceptSet.dirtyFlag().isDirty() ? 'unsaved' : 'open';
      }
      return '';
    });

    const navUrl = ko.pureComputed(function () {
      let url = "#/conceptsets";
      if (appState.RepositoryConceptSet.current()) {
        url = `#${constants.paths.mode(appState.RepositoryConceptSet.current().id || 0)}`;
      }
      return url;
    });

    return {
      title: ko.i18n('navigation.conceptsets', 'Concept Sets'),
      buildRoutes,
      navUrl,
      icon: 'shopping-cart',
			statusCss,
    };
  }
);