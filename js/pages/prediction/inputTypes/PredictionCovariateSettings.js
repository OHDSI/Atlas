define([
    'knockout', 
    'featureextraction/InputTypes/CovariateSettings'
], function (
    ko,
    CovariateSettings
){
    class PredictionCovariateSettings extends CovariateSettings {
        constructor(data) {
            super(data);
            this.includedCovariateConceptSet = ko.observable(data.includedCovariateConceptSet || {});
            this.excludedCovariateConceptSet = ko.observable(data.excludedCovariateConceptSet || {});
        }
    }
	return PredictionCovariateSettings;
});