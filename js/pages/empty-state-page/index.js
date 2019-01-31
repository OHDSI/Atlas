define(
  (require, exports) => {
    const buildRoutes = require('./routes');

    return {
      title: 'Entity cannot be found',
      buildRoutes,
      navUrl: () => '#/empty-state-page',
        hiddenFromMenu: true,
      icon: 'database',
			statusCss: () => ''
    };
  }
);