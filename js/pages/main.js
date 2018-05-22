define(
  (require, exports) => {
    const home = require('./home/index');
    const dataSources = require('./data-sources/index');
    const vocabulary = require('./vocabulary/index');
    const conceptSets = require('./concept-sets/index');
    const cohortDefinitions = require('./cohort-definitions/index');
    const incidenceRates = require('./incidence-rates/index');
    const profiles = require('./profiles/index');
    const estimation = require('./estimation/index');
    const prediction = require('./prediction/index');
    const jobs = require('./jobs/index');
    const configuration = require('./configuration/index');
    const feedback = require('./feedback/index');

    return {
      home,
      dataSources,
      vocabulary,
      conceptSets,
      cohortDefinitions,
      incidenceRates,
      profiles,
      estimation,
      prediction,
      jobs,
      configuration,
      feedback,
    };
  }
);