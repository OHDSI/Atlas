define(
  (require, exports) => {
    const buildRoutes = require('./routes');

    return {
      title: 'Configuration',
      buildRoutes,
      baseUrl: 'configure',
      icon: 'cogs',
    };
  }
);