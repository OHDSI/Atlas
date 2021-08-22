define(
  (require, exports) => {
    const ko = require('knockout');
    const appState = require('atlas-state');
    const buildRoutes = require('./routes');

    const statusCss = ko.pureComputed(() => {
      if (appState.ConfigurationSource.current()) {
        return appState.ConfigurationSource.dirtyFlag().isDirty() ? 'unsaved' : 'open';
      }
      return '';
    });

    const navUrl = ko.pureComputed(() => {
      return appState.ConfigurationSource.current()
        ? `#/source/${(appState.ConfigurationSource.selectedId() || 0)}`
        : '#/configure';
    });

    return {
      title: ko.i18n('navigation.configuration', 'Configuration'),
      buildRoutes,
      navUrl,
      icon: 'cogs',
      statusCss,
    };
  }
);