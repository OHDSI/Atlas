 // todo: refactoring hardcode on the backend
 //       org/ohdsi/webapi/cohortresults/CohortResultsAnalysisRunner.java:1625
 //       add the request that get these params from backend
define([], () => {
    const defaultInputParamsValues = {
        '@vocabulary_database_schema': 'Vocabulary',
        '@cdm_database_schema': 'CDM',
        '@target_database_schema':'Results'
    };

    return defaultInputParamsValues;

})