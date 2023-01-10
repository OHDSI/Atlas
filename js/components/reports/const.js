define(
  (require, factory) => {
    const ko = require('knockout');
    const config = require('appConfig');

    const apiPaths = {
      report: ({ sourceKey, path, conceptId }) => `${config.api.url}cdmresults/${sourceKey}/${path}${conceptId !== null ? `/${conceptId}` : ''}`,
    };

    // aggregate property descriptors
    const recordsPerPersonProperty = {
      name: "recordsPerPerson",
      description: ko.i18n('dataSources.const.recordsPerPerson', 'Records per person')
    };
    const lengthOfEraProperty = {
      name: "lengthOfEra",
      description: ko.i18n('dataSources.const.lengthOfEra', 'Length of era')
    };

    const reports = [{
          name: ko.i18n('dataSources.reports.dashboard', 'Dashboard'),
          path: "dashboard",
          component: "report-dashboard",
          summary: ko.observable()
          },
          {
              name: ko.i18n('dataSources.reports.dataDensity', 'Data Density'),
              path: "datadensity",
              component: "report-datadensity",
          },
          {
              name: ko.i18n('dataSources.reports.person', 'Person'),
              path: "person",
              component: "report-person",
          },
          {
              name: ko.i18n('dataSources.reports.visit', 'Visit'),
              path: "visit",
              component: "report-visit",
          },
          {
              name: ko.i18n('dataSources.reports.conditionOccurrence', 'Condition Occurrence'),
              path: "condition",
              component: "report-condition",
          },
          {
              name: ko.i18n('dataSources.reports.conditionEra', 'Condition Era'),
              path: "conditionera",
              component: "report-condition-era",
          },
          {
              name: ko.i18n('dataSources.reports.procedure', 'Procedure'),
              path: "procedure",
              component: "report-procedure",
          },
          {
              name: ko.i18n('dataSources.reports.drugExposure', 'Drug Exposure'),
              path: "drug",
              component: "report-drug",
          },
          {
              name: ko.i18n('dataSources.reports.drugEra', 'Drug Era'),
              path: "drugera",
              component: "report-drug-era",
          },
          {
              name: ko.i18n('dataSources.reports.measurement', 'Measurement'),
              path: "measurement",
              component: "report-measurement",
          },
          {
              name: ko.i18n('dataSources.reports.observation', 'Observation'),
              path: "observation",
              component: "report-observation",
          },
          {
              name: ko.i18n('dataSources.reports.observationPeriod', 'Observation Period'),
              path: "observationPeriod",
              component: "report-observation-period"
          },
          {
              name: ko.i18n('dataSources.reports.death', 'Death'),
              path: "death",
              component: "report-death",
          }
      ];

    return {
      apiPaths,
      aggProperties: {
        byPerson: recordsPerPersonProperty,
        byLengthOfEra: lengthOfEraProperty,
      },
      reports,
    };
  }
);