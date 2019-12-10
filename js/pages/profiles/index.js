define(
  (require, exports) => {
    const ko = require('knockout');
    const buildRoutes = require('./routes');

    return {
      title: ko.i18n('navigation.profiles', 'Profiles'),
      buildRoutes,
      navUrl: () => '#/profiles',
      icon: 'user',
        statusCss: () => ''
    };
  }
);