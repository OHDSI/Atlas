define(
  (require, exports) => {
    const buildRoutes = require('./routes');

    return {
      title: 'Home',
      buildRoutes,
      navUrl: () => '#/home',
      icon: 'home',
			statusCss: () => ""
    };
  }
);