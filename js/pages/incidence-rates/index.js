define(
  (require, exports) => {
    const buildRoutes = require('./routes');

    return {
      title: 'Incidence Rates',
      buildRoutes,
      baseUrl: 'incidence-rates', // todo: css: irStatusCss, attr: {href: irAnalysisURL}
      icon: 'bolt',
    };
  }
);