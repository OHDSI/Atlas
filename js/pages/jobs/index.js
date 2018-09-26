define(
  (require, exports) => {
    const buildRoutes = require('./routes');

    return {
      title: 'Jobs',
      buildRoutes,
      navUrl: () => '#/jobs',
      icon: 'tasks',
			statusCss: () => ''
    };
  }
);