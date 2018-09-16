define(
  (require, exports) => {
    const buildRoutes = require('./routes');

    return {
      title: 'Feedback',
      buildRoutes,
      navUrl: () => '#/feedback', // todo: {href: supportURL, target: targetSupportURL}
      icon: 'comment',
			statusCss: () => ''
    };
  }
);