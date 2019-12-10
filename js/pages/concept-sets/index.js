define(
  (require, exports) => {
    const ko = require('knockout')
    const buildRoutes = require('./routes');
    return {
      title: ko.i18n('navigation.conceptsets', 'Concept Sets'),
      buildRoutes,
      navUrl: () => '#/conceptsets',
      icon: 'shopping-cart',
			statusCss: () => ''
    };
  }
);