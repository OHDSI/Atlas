define(
  (require, exports) => {
    const pageTitle = 'Estimation';

    const apiPaths = {
      ccaAnalysis: id => `#/estimation/cca/${id}`,
      createCcaAnalysis: () => '#/estimation/cca/0',
      browser: () => '#/estimation',
    };

    const conceptSetCrossReference = {
      targetComparatorOutcome: {
        targetName: "estimationAnalysisSettings.analysisSpecification.targetComparatorOutcomes",
        propertyName: {
          includedCovariateConcepts: "includedCovariateConceptIds",
          excludedCovariateConcepts: "excludedCovariateConceptIds",
        },
      },
      negativeControlOutcomes: {
        targetName: "negativeControlOutcomes",
        propertyName: "outcomeId",
      },
      analysisCovariateSettings: {
        targetName: "estimationAnalysisSettings.analysisSpecification.cohortMethodAnalysisList.getDbCohortMethodDataArgs.covariateSettings",
        propertyName: {
          includedCovariateConcepts: "includedCovariateConceptIds",
          excludedCovariateConcepts: "excludedCovariateConceptIds",
        },
      },
      positiveControlCovariateSettings: {
        targetName: "positiveControlSynthesisArgs.covariateSettings",
        propertyName: {
          includedCovariateConcepts: "includedCovariateConceptIds",
          excludedCovariateConcepts: "excludedCovariateConceptIds",
        },
      }
    };

    return {
      pageTitle,
      apiPaths,
      conceptSetCrossReference,
    };
  }
);