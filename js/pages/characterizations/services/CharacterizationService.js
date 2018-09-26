define([
    'services/httpService',
    'appConfig',
], function (
    httpService,
    config,
) {
    function loadCharacterizationList() {
        return httpService
            .doGet(config.webAPIRoot + 'cohort-characterization')
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
        return request = httpService.doPost(config.webAPIRoot + 'cohort-characterization', design).then(res => res.data);
    }

    function updateCharacterization(id, design) {
        return httpService.doPut(config.webAPIRoot + 'cohort-characterization/' + id, design).then(res => res.data);
    }

    function loadCharacterizationExecutionList(id) {
        return httpService
            .doGet(config.webAPIRoot + 'cohort-characterization/' + id + '/generation')
            .then(res => res.data);
    }

    function loadCharacterizationExecution(id) {
        return httpService
            .doGet(config.webAPIRoot + 'cohort-characterization/generation/' + id)
            .then(res => res.data);
    }

    function loadCharacterizationResults(generationId) {
        return httpService
            .doGet(config.webAPIRoot + 'cohort-characterization/generation/' + generationId + '/result')
            .then(res => res.data);
    }

    function loadCharacterizationExportDesignByGeneration(generationId) {
        return httpService
            .doGet(config.webAPIRoot + 'cohort-characterization/generation/' + generationId + '/design')
            .then(res => res.data);
    }

    function runGeneration(ccId, sourcekey) {
        return httpService
            .doPost(config.webAPIRoot + 'cohort-characterization/' + ccId + '/generation/' + sourcekey)
            .then(res => res.data);
    }

    function importCharacterization(design) {
        return httpService
            .doPost(config.webAPIRoot + 'cohort-characterization/import', design)
            .then(res => res.data);
    }

    return {
        loadCharacterizationList,
        importCharacterization,
        loadCharacterizationDesign,
        loadCharacterizationExportDesign,
        createCharacterization,
        updateCharacterization,
        deleteCharacterization,
        loadCharacterizationExecutionList,
        loadCharacterizationExecution,
        loadCharacterizationResults,
        loadCharacterizationExportDesignByGeneration,
        runGeneration,
    };
});
