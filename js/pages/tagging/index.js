define(
  (require, exports) => {
    const ko = require('knockout');
    const buildRoutes = require('./routes');

    return {
      title: ko.i18n('navigation.tagging', 'Tagging'),
      buildRoutes,
      navUrl: () => '#/tagging',
      icon: 'tags',
			statusCss: () => ''
    };
  }
);