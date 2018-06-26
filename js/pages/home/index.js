define(
  (require, exports) => {
    const buildRoutes = require('./routes');

    return {
      title: 'Home',
      buildRoutes,
      baseUrl: 'home',
      icon: 'home',
    };
  }
);