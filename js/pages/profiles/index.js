define(
  (require, exports) => {
    const buildRoutes = require('./routes');

    return {
      title: 'Profiles',
      buildRoutes,
      navUrl: () => '#/profiles',
      icon: 'user',
        statusCss: () => ''
    };
  }
);