define(
  (require, exports) => {
    const ko = require('knockout');
    const buildRoutes = require('./routes');

    return {
      title: ko.i18n('navigation.tools', 'Tools'),
      buildRoutes,
      navUrl: () => '#/tools',
      icon: 'toolbox',
			statusCss: () => ""
    };
  }
);