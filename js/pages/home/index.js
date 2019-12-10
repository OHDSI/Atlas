define(
  (require, exports) => {
    const ko = require('knockout');
    const buildRoutes = require('./routes');

    return {
      title: ko.i18n('navigation.home', 'Home'),
      buildRoutes,
      navUrl: () => '#/home',
      icon: 'home',
			statusCss: () => ""
    };
  }
);