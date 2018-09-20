define([
    'services/http',
    'appConfig'
], function (
    httpService,
    config
) {
	
    var featureAnalysisListData = "{}";
		var featureAnalysisData = "{}";
		var featureAnalysisDomainsData = "{}";
	
    function loadFeatureAnalysisList() {
        return httpService.doGet(config.webAPIRoot + 'feature-analysis?size=100000').then(res => res.data);
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
