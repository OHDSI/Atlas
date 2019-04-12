define(
  (require, exports) => {
    const buildRoutes = require('./routes');

    return {
      title: 'Data Sources',
      buildRoutes,
      navUrl: () => '#/datasources',
      icon: 'database',
        statusCss: () => ''
    };
  }
);