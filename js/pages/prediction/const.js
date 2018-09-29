define(
  (require, exports) => {
    const pageTitle = 'Prediction';

    const apiPaths = {
      analysis: id => `#/prediction/${id}`,
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

    return {
      pageTitle,
      apiPaths,
      conceptSetCrossReference,
    };
  }
);