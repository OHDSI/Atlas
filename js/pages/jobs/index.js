define(
  (require, exports) => {
    const ko = require('knockout');
    const buildRoutes = require('./routes');

    return {
      title: ko.i18n('navigation.jobs', 'Jobs'),
      buildRoutes,
      navUrl: () => '#/jobs',
      icon: 'tasks',
			statusCss: () => ''
    };
  }
);