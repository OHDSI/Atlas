define(
  (require, exports) => {
    const constants = require('./const');
    const buildRoutes = require('./routes');

    return {
      title: constants.pageTitle,
      buildRoutes,
      baseUrl: 'cc/characterizations',
      icon: 'line-chart',
    };
  }
);