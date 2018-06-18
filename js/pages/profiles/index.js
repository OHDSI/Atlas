define(
  (require, exports) => {
    const buildRoutes = require('./routes');

    return {
      title: 'Profiles',
      buildRoutes,
      baseUrl: 'profiles',
      icon: 'user',
    };
  }
);