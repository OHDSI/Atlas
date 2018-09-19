define([
    'webapi/AuthAPI',
], function (
    AuthAPI,
) {

    function isPermittedCreateCC() {
        return AuthAPI.isPermitted(`cohort-characterization:post`);
    }

    function isPermittedImportCC() {
        return AuthAPI.isPermitted(`cohort-characterization:import:post`);
    }

    function isPermittedGetCCList() {
        return AuthAPI.isPermitted(`cohort-characterization:get`);
    }

    function isPermittedGetCC(id) {
        return AuthAPI.isPermitted(`cohort-characterization:${id}:get`);
    }

    function isPermittedUpdateCC(id) {
        return AuthAPI.isPermitted(`cohort-characterization:${id}:put`);
    }

    function isPermittedDeleteCC(id) {
        return AuthAPI.isPermitted(`cohort-characterization:${id}:delete`);
    }

    function isPermittedGetCCGenerations(id) {
        return AuthAPI.isPermitted(`cohort-characterization:${id}:generation:get`);
    }

    function isPermittedGenerateCC(id, sourceKey) {
        return AuthAPI.isPermitted(`cohort-characterization:${id}:generation:*:post`) && AuthAPI.isPermitted(`source:${sourceKey}:access`);
    }

    function isPermittedGetCCGenerationResults(sourceKey) {
        return AuthAPI.isPermitted(`cohort-characterization:generation:*:result:get`) && AuthAPI.isPermitted(`source:${sourceKey}:access`);
    }

    function isPermittedExportGenerationDesign(id) {
        return AuthAPI.isPermitted(`cohort-characterization:generation:${id}:design:get`);
    }

    function isPermittedExportCC(id) {
        return AuthAPI.isPermitted(`cohort-characterization:${id}:export:get`);
    }


    return {
        isPermittedCreateCC,
        isPermittedImportCC,
        isPermittedGetCCList,
        isPermittedGetCC,
        isPermittedUpdateCC,
        isPermittedDeleteCC,
        isPermittedGetCCGenerations,
        isPermittedGenerateCC,
        isPermittedGetCCGenerationResults,
        isPermittedExportGenerationDesign,
        isPermittedExportCC
    };
});
