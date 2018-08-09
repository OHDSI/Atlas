define([
    'text!pages/characterizations/stubs/feature-analysis-list-data.json',
], function (
    featureAnalysisListData,
) {
    function loadFeatureAnalysisList() {
        return new Promise(resolve => {
            setTimeout(
                () => {
                    const featureAnalysisData = JSON.parse(featureAnalysisListData);
                    resolve(featureAnalysisData.analyses);
                },
                2000
            );
        });
    }

    return {
        loadFeatureAnalysisList,
    };
});
