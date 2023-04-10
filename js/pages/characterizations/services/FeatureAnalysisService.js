define([
    'services/http',
    'services/file',
    'appConfig',
	'services/AuthAPI',
], function (
    httpService,
    fileService,
    config,
    authApi
) {

    function loadFeatureAnalysisList() {
        return httpService.doGet(config.webAPIRoot + 'feature-analysis?size=100000').then(res => res.data);
    }

    function loadFeatureAnalysis(id) {
        return httpService.doGet(config.webAPIRoot + `feature-analysis/${id}`).then(res => res.data);
    }

    function loadFeatureAnalysisDomains() {
        return httpService.doGet(config.webAPIRoot + 'feature-analysis/domains').then(res => res.data);
    }

    function createFeatureAnalysis(design) {
        let promise = httpService.doPost(config.webAPIRoot + 'feature-analysis', design).then(res => res.data);
        promise.then(authApi.refreshToken);
        return promise;
    }

    function updateFeatureAnalysis(id, design) {
        return httpService.doPut(config.webAPIRoot + `feature-analysis/${id}`, design).then(res => res.data);
    }

    function deleteFeatureAnalysis(id) {
        return httpService.doDelete(config.webAPIRoot + `feature-analysis/${id}`).then(res => res.data);
    }

    function exists(name, id) {
        return httpService.doGet(`${config.webAPIRoot}feature-analysis/${id}/exists?name=${name}`)
            .then(res => res.data);
    }

    function exportConceptSets(id) {
        return fileService.loadZip(`${config.webAPIRoot}feature-analysis/${id}/export/conceptset`);
    }

    function loadAggregates() {
        return httpService.doGet(`${config.webAPIRoot}feature-analysis/aggregates`).then(res => res.data);
    }

    function copyFeatureAnalysis(id) {
        let promise = httpService.doGet(`${config.webAPIRoot}feature-analysis/${id}/copy`);
        promise.then(authApi.refreshToken);
        return promise;        
    }

    return {
        loadFeatureAnalysisList,
        loadFeatureAnalysis,
        loadFeatureAnalysisDomains,
        createFeatureAnalysis,
        updateFeatureAnalysis,
        deleteFeatureAnalysis,
        exists,
        exportConceptSets,
        copyFeatureAnalysis,
        loadAggregates,
    };
});
