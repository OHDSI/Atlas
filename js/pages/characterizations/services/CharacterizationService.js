define([
    'services/http',
    'appConfig',
], function (
    httpService,
    config,
) {
    function loadCharacterizationList() {
        return httpService
            .doGet(config.webAPIRoot + 'cohort-characterizations')
            .then(res => res.data);
    }

    function loadCharacterization(id) {
        return httpService
            .doGet(config.webAPIRoot + 'cohort-characterizations/' + id)
            .then(res => res.data);
    }

    function deleteCharacterization(id) {
        return httpService
            .doDelete(config.webAPIRoot + 'cohort-characterizations/' + id)
            .then(res => res.data);
    }

    function loadCharacterizationDesign(id) {
        return httpService
            .doGet(config.webAPIRoot + 'cohort-characterizations/' + id + '/design')
            .then(res => res.data);
    }

    function createCharacterization(design) {
        return request = httpService.doPost(config.webAPIRoot + 'cohort-characterizations', design).then(res => res.data);
    }

    function updateCharacterization(id, design) {
        return httpService.doPut(config.webAPIRoot + 'cohort-characterizations/' + id, design).then(res => res.data);
    }

    function loadCharacterizationExecutionList(id) {
        return httpService
            .doGet(config.webAPIRoot + 'cohort-characterizations/' + id + '/generations')
            .then(res => res.data);
    }

    function loadCharacterizationExecution(id) {
        return httpService
            .doGet(config.webAPIRoot + 'cohort-characterizations/generations/' + id)
            .then(res => res.data);
    }

    function loadCharacterizationResults(generationId) {
        return httpService
            .doGet(config.webAPIRoot + 'cohort-characterizations/generations/' + generationId + '/results')
            .then(res => res.data);
    }

    function loadCharacterizationDesignByGeneration(generationId) {
        return httpService
            .doGet(config.webAPIRoot + 'cohort-characterizations/generations/' + generationId + '/design')
            .then(res => res.data);
    }

    function runGeneration(ccId, sourcekey) {
        return httpService
            .doPost(config.webAPIRoot + 'cohort-characterizations/' + ccId + '/generate/' + sourcekey)
            .then(res => res.data);
    }

    return {
        loadCharacterizationList,
        loadCharacterization,
        loadCharacterizationDesign,
        createCharacterization,
        updateCharacterization,
        deleteCharacterization,
        loadCharacterizationExecutionList,
        loadCharacterizationExecution,
        loadCharacterizationResults,
        loadCharacterizationDesignByGeneration,
        runGeneration,
    };
});
