define([
    'services/http',
    'services/file',
    'appConfig',
    'utils/ExecutionUtils',
    'services/AuthAPI',
], function (
    httpService,
    fileService,
    config,
    executionUtils,
    authApi
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

    async function loadCharacterizationDesign(id) {
        const result = await httpService
            .doGet(config.webAPIRoot + 'cohort-characterization/' + id + '/design')
            .then(res => res.data);
        await authApi.refreshToken();
        return result;
        
    }

    function loadCharacterizationExportDesign(id) {
        return httpService
            .doGet(config.webAPIRoot + 'cohort-characterization/' + id + '/export')
            .then(res => res.data);
    }

    async function  createCharacterization(design) {
        return authApi.executeWithRefresh(httpService.doPost(config.webAPIRoot + 'cohort-characterization', design).then(res => res.data));
    }

    async function copyCharacterization(id) {
        return authApi.executeWithRefresh(httpService.doPost(config.webAPIRoot + 'cohort-characterization/' + id).then(res => res.data));
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

    async function generate(ccId, sourcekey) {
        return authApi.executeWithRefresh(httpService
            .doPost(config.webAPIRoot + 'cohort-characterization/' + ccId + '/generation/' + sourcekey)
            .then(res => res.data));
    }

    async function importCharacterization(design) {
        return authApi.executeWithRefresh(httpService
            .doPost(config.webAPIRoot + 'cohort-characterization/import', design)
            .then(res => res.data));
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

    function exportConceptSets(id) {
        return fileService.loadZip(`${config.webAPIRoot}cohort-characterization/${id}/export/conceptset`,
            `cohort_characterization_${id}_export.zip`);
    }
	function runDiagnostics(design) {
        return httpService
            .doPost(`${config.webAPIRoot}cohort-characterization/check`, design)
            .then(res => res.data);
	}

    function getVersions(id) {
        return httpService.doGet(`${config.webAPIRoot}cohort-characterization/${id}/version/`)
            .then(res => res.data);
    }

    function getVersion(id, versionNumber) {
        return httpService.doGet(`${config.webAPIRoot}cohort-characterization/${id}/version/${versionNumber}`)
            .then(res => res.data);
    }

    async function copyVersion(id, versionNumber) {
        return authApi.executeWithRefresh(httpService.doPut(`${config.webAPIRoot}cohort-characterization/${id}/version/${versionNumber}/createAsset`)
            .then(res => res.data));
    }

    function updateVersion(version) {
        return httpService.doPut(`${config.webAPIRoot}cohort-characterization/${version.assetId}/version/${version.version}`, {
            comment: version.comment,
            archived: version.archived
        }).then(res => res.data);
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
        exportConceptSets,
        runDiagnostics,
        getVersions,
        getVersion,
        updateVersion,
        copyVersion
    };
});
