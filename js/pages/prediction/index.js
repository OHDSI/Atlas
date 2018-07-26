define(
  (require, exports) => {
    const buildRoutes = require('./routes');

    return {
      title: 'Prediction',
      buildRoutes,
      baseUrl: 'plp', // todo: css: plpCss, attr: {href: plpURL}
      icon: 'heartbeat',
    };
  }
);