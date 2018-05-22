define(
  (require, exports) => {
    const buildRoutes = require('./routes');

    return {
      title: 'Jobs',
      buildRoutes,
      baseUrl: 'jobs',
      icon: 'tasks',
    };
  }
);