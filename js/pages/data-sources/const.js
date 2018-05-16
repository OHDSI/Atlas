define(
  (require, factory) => {
    const config = require('appConfig');

    const apiPaths = {
      report: ({ sourceKey, path, conceptId }) => `${config.api.url}cdmresults/${sourceKey}/${path}${conceptId !== null ? `/${conceptId}` : ''}`,
    };

    return {
      apiPaths,
    };
  }
);