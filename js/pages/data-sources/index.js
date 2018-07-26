define(
  (require, exports) => {
    const buildRoutes = require('./routes');

    return {
      title: 'Data Sources',
      buildRoutes,
      baseUrl: 'datasources',
      icon: 'database',
    };
  }
);