define(
  (require, exports) => {
    const buildRoutes = require('./routes');

    return {
      title: 'Configuration',
      buildRoutes,
      navUrl: () => '#/configure',
      icon: 'cogs',
			statusCss: () => ''
    };
  }
);