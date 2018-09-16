define(
  (require, exports) => {
    const buildRoutes = require('./routes');

    return {
      title: 'Estimation',
      buildRoutes,
      navUrl: () => '#/estimation',
      icon: 'balance-scale',
			statusCss: () => ''
    };
  }
);