define(
  (require, exports) => {
    const buildRoutes = require('./routes');

    return {
      title: 'Prediction',
      buildRoutes,
      navUrl: () => '#/plp',
      icon: 'heartbeat',
			statusCss: () => '',
    };
  }
);