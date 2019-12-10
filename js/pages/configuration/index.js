define(
  (require, exports) => {
    const ko = require('knockout');
    const buildRoutes = require('./routes');

    return {
      title: ko.i18n('navigation.configuration', 'Configuration'),
      buildRoutes,
      navUrl: () => '#/configure',
      icon: 'cogs',
			statusCss: () => ''
    };
  }
);