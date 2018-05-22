define(
  (require, exports) => {
    const buildRoutes = require('./routes');

    return {
      title: 'Cohort Definitions',
      buildRoutes,
      baseUrl: 'cohortdefinitions',
      icon: 'users',
    };
  }
);