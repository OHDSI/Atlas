define(
  (require, exports) => {
    const pageTitle = 'Prediction';

    const apiPaths = {
      analysis: id => `#/prediction/${id}`,
      downloadPackage: id => `prediction/${id}/download`,
      createAnalysis: () => '#/prediction/0',
      browser: () => '#/prediction',
    };

    const conceptSetCrossReference = {
      covariateSettings: {
        targetName: "covariateSettings",
        propertyName: {
          includedCovariateConcepts: "includedCovariateConceptIds",
          excludedCovariateConcepts: "excludedCovariateConceptIds",
        },
      },
    };

    const defaultNontemporalCovariates = {
      "temporal": false,
      "DemographicsGender": true,
      "DemographicsAgeGroup": true,
      "DemographicsRace": true,
      "DemographicsEthnicity": true,
      "DemographicsIndexMonth": true,
      "ConditionGroupEraLongTerm": true,
      "ConditionGroupEraShortTerm": true,
      "DrugGroupEraLongTerm": true,
      "DrugGroupEraShortTerm": true,
      "DrugGroupEraOverlapping": true,
      "ProcedureOccurrenceLongTerm": true,
      "ProcedureOccurrenceShortTerm": true,
      "DeviceExposureLongTerm": true,
      "DeviceExposureShortTerm": true,
      "MeasurementLongTerm": true,
      "MeasurementShortTerm": true,
      "MeasurementRangeGroupLongTerm": true,
      "ObservationLongTerm": true,
      "ObservationShortTerm": true,
      "CharlsonIndex": true,
      "Dcsi": true,
      "Chads2": true,
      "Chads2Vasc": true,
      "includedCovariateConceptIds": [],
      "includedCovariateIds": [],
      "addDescendantsToInclude": false,
      "excludedCovariateConceptIds": [],
      "addDescendantsToExclude": false,
      "shortTermStartDays": -30,
      "mediumTermStartDays": -180,
      "endDays": 0,
      "longTermStartDays": -365
    };

    return {
      pageTitle,
      apiPaths,
      conceptSetCrossReference,
      defaultNontemporalCovariates,
    };
  }
);