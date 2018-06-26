define(
  (require, exports) => {
    const buildRoutes = require('./routes');

    return {
      title: 'Estimation',
      buildRoutes,
      baseUrl: 'estimation',
      icon: 'balance-scale',
    };
  }
);