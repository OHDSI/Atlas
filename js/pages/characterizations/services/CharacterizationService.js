define([
    'services/http',
    'appConfig',
    'utils/ExecutionUtils'
], function (
    httpService,
    config,
    executionUtils,
) {
    function loadCharacterizationList() {
        return httpService
            .doGet(config.webAPIRoot + 'cohort-characterization?size=10000')
            .then(res => res.data);
    }

    function deleteCharacterization(id) {
        return httpService
            .doDelete(config.webAPIRoot + 'cohort-characterization/' + id)
            .then(res => res.data);
    }

    function loadCharacterizationDesign(id) {
        return httpService
            .doGet(config.webAPIRoot + 'cohort-characterization/' + id + '/design')
            .then(res => res.data);
    }

    function loadCharacterizationExportDesign(id) {
        return httpService
            .doGet(config.webAPIRoot + 'cohort-characterization/' + id + '/export')
            .then(res => res.data);
    }

    function createCharacterization(design) {
        return httpService.doPost(config.webAPIRoot + 'cohort-characterization', design).then(res => res.data);
    }

    function copyCharacterization(id) {
        return httpService.doPost(config.webAPIRoot + 'cohort-characterization/' + id).then(res => res.data);
    }

    function updateCharacterization(id, design) {
        return httpService.doPut(config.webAPIRoot + 'cohort-characterization/' + id, design).then(res => res.data);
    }

    function listExecutions(id) {
        return httpService
            .doGet(config.webAPIRoot + 'cohort-characterization/' + id + '/generation')
            .then(res => executionUtils.generateVersionTags(res.data));
    }

    function loadCharacterizationExecution(id) {
        return httpService
            .doGet(config.webAPIRoot + 'cohort-characterization/generation/' + id)
            .then(res => res.data);
    }

    function loadCharacterizationResults(generationId, params) {
        return httpService
            .doPost(config.webAPIRoot + 'cohort-characterization/generation/' + generationId + '/result', params)
            .then(res => res.data);
    }

    function loadCharacterizationResultsCount(generationId) {
        return httpService
            .doGet(config.webAPIRoot + 'cohort-characterization/generation/' + generationId + '/result/count')
            .then(res => res.data);
    }

    function loadExportDesignByGeneration(generationId) {
        return httpService
            .doGet(config.webAPIRoot + 'cohort-characterization/generation/' + generationId + '/design')
            .then(res => res.data);
    }

    function generate(ccId, sourcekey) {
        return httpService
            .doPost(config.webAPIRoot + 'cohort-characterization/' + ccId + '/generation/' + sourcekey)
            .then(res => res.data);
    }

    function importCharacterization(design) {
        return httpService
            .doPost(config.webAPIRoot + 'cohort-characterization/import', design)
            .then(res => res.data);
    }

    function getPrevalenceStatsByGeneration(generationId, analysisId, cohortId, covariateId) {
        return httpService
          .doGet(config.webAPIRoot + `cohort-characterization/generation/${generationId}/explore/prevalence/${analysisId}/${cohortId}/${covariateId}`)
          .then(res => res.data);
    }

    function cancelGeneration(ccId, sourceKey) {
        return httpService
          .doDelete(config.webAPIRoot + 'cohort-characterization/' + ccId + '/generation/' + sourceKey)
          .then(res => res.data);
    }

    function exists(name, id) {
        return httpService
            .doGet(`${config.webAPIRoot}cohort-characterization/${id}/exists?name=${name}`)
            .then(res => res.data);
    }

	function runDiagnostics(design) {
        return httpService
            .doPost(`${config.webAPIRoot}cohort-characterization/check`, design)
            .then(res => res.data);
	}

    return {
        loadCharacterizationList,
        importCharacterization,
        loadCharacterizationDesign,
        loadCharacterizationExportDesign,
        createCharacterization,
        copyCharacterization,
        updateCharacterization,
        deleteCharacterization,
        listExecutions,
        loadCharacterizationExecution,
        loadCharacterizationResults,
        loadCharacterizationResultsCount,
        loadExportDesignByGeneration,
        generate,
        getPrevalenceStatsByGeneration,
        cancelGeneration,
        exists,
        runDiagnostics,
    };
});
