define([
    'services/http',
    'appConfig',
    'text!pages/characterizations/stubs/feature-analysis-list-data.json',
    'text!pages/characterizations/stubs/feature-analysis-data.json',
    'text!pages/characterizations/stubs/feature-analysis-domains-data.json',
], function (
    httpService,
    config,
    featureAnalysisListData,
    featureAnalysisData,
    featureAnalysisDomainsData
) {
    function loadFeatureAnalysisList() {
        return httpService.doGet(config.webAPIRoot + 'feature-analyses?size=100000').then(res => res.data);
    }

    function loadFeatureAnalysis() {
        return new Promise(resolve => {
            setTimeout(
                () => {
                    const data = JSON.parse(featureAnalysisData);
                    resolve(data);
                },
                2000
            );
        });
    }

    function loadFeatureAnalysisDomains() {
        return new Promise(resolve => {
            setTimeout(
                () => {
                    const data = JSON.parse(featureAnalysisDomainsData);
                    resolve(data.domains);
                },
                2000
            );
        });
    }
    return {
        loadFeatureAnalysisList,
        loadFeatureAnalysis,
        loadFeatureAnalysisDomains,
    };
});
