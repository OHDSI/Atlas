define(
  (require, exports) => {
    const buildRoutes = require('./routes');

    return {
      title: 'Concept Sets',
      buildRoutes,
      baseUrl: 'conceptsets',
      icon: 'shopping-cart',
    };
  }
);