define(
  (require, exports) => {
    const buildRoutes = require('./routes');

    return {
      title: 'Empty State',
      buildRoutes,
      navUrl: () => '#/empty-state-page',
        hiddenFromMenu: true,
      icon: 'database',
			statusCss: () => ''
    };
  }
);