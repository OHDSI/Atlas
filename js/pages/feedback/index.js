define(
  (require, exports) => {
    const ko = require('knockout');
    const buildRoutes = require('./routes');

    return {
      title: ko.i18n('navigation.feedback', 'Feedback'),
      buildRoutes,
      navUrl: () => '#/feedback',
      icon: 'comment',
			statusCss: () => ''
    };
  }
);