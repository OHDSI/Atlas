define(
  (require, exports) => {
    const ko = require('knockout');
    const buildRoutes = require('./routes');

    return {
      title: ko.i18n('navigation.datasources', 'Data Sources'),
      buildRoutes,
      navUrl: () => '#/datasources',
      icon: 'database',
        statusCss: () => ''
    };
  }
);