define(
  (require, exports) => {
    const buildRoutes = require('./routes');

    return {
      title: 'Cohort Definitions',
      buildRoutes,
      navUrl: () => '#/cohortdefinitions',
      icon: 'users',
      statusCss: () => ''
    };
  }
);