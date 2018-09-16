define(
  (require, exports) => {
    const buildRoutes = require('./routes');

    return {
      title: 'Prediction',
      buildRoutes,
      navUrl: () => '#/plp', // todo: css: plpCss, attr: {href: plpURL}
      icon: 'heartbeat',
			statusCss: () => '',
    };
  }
);