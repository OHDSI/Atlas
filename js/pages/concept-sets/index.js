define(
  (require, exports) => {
    const buildRoutes = require('./routes');
    return {
      title: 'Concept Sets',
      buildRoutes,
      navUrl: () => '#/conceptsets',
      icon: 'shopping-cart',
			statusCss: () => ''
    };
  }
);