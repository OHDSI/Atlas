define(
  (require, exports) => {
    const ko = require('knockout');
    const buildRoutes = require('./routes');
    const appState = require('atlas-state');

    const statusCss = ko.pureComputed(() => {
      if (appState.ConfigurationSource.current())
        return appState.ConfigurationSource.dirtyFlag()
          .isDirty() ? 'unsaved' : 'open';
      return '';
    });

    const navUrl = ko.pureComputed(() => {
      let url = "#/configure";
      if (appState.ConfigurationSource.current()) {
        url = `#/source/${(appState.ConfigurationSource.current().sourceId() || 'new')}`;
      }
      return url;
    });

    return {
      title: 'Configuration',
      icon: 'cogs',
      buildRoutes,
      navUrl,
			statusCss,
    };
  }
);