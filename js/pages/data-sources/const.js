define(
  (require, factory) => {
    const config = require('appConfig');

    const apiPaths = {
      report: ({ sourceKey, path, conceptId }) => `${config.api.url}cdmresults/${sourceKey}/${path}${conceptId !== null ? `/${conceptId}` : ''}`,
    };

    // aggregate property descriptors
    const recordsPerPersonProperty = {
      name: "recordsPerPerson",
      description: "Records per person"
    };
    const lengthOfEraProperty = {
      name: "lengthOfEra",
      description: "Length of era"
    };

    return {
      apiPaths,
      aggProperties: {
        byPerson: recordsPerPersonProperty,
        byLengthOfEra: lengthOfEraProperty,
      },
    };
  }
);