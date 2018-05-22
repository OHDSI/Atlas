define(
  (require, exports) => {
    const buildRoutes = require('./routes');

    return {
      title: 'Feedback',
      buildRoutes,
      baseUrl: 'feedback', // todo: {href: supportURL, target: targetSupportURL}
      icon: 'comment',
    };
  }
);