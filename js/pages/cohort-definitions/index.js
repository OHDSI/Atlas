define(
  (require, exports) => {
    const ko = require('knockout');
    const buildRoutes = require('./routes');

    return {
      title: ko.i18n('navigation.cohortdefinitions', 'Cohort Definitions'),
      buildRoutes,
      navUrl: () => '#/cohortdefinitions',
      icon: 'users',
      statusCss: () => ''
    };
  }
);