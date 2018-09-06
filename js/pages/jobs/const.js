define(
  (require, exports) => {
    const config = require('appConfig');
    const pageTitle = 'Jobs';
    const paths = {
      jobs: () => `${config.api.url}job/execution?comprehensivePage=true`
    };

    return {
      pageTitle,
      paths,
    };
  }
);