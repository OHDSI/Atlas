define(
  (require, exports) => {
    const buildRoutes = require('./routes');

    return {
      title: 'Feedback',
      buildRoutes,
      navUrl: () => '#/feedback',
      icon: 'comment',
			statusCss: () => ''
    };
  }
);