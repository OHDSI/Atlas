define([
    'knockout', 
    'featureextraction/InputTypes/CovariateSettings'
], function (
    ko,
    CovariateSettings
){
    class EstimationCovariateSettings extends CovariateSettings {
        constructor(data) {
            super(data);
            this.includedCovariateConceptSet = ko.observable(data.includedCovariateConceptSet || {});
            this.excludedCovariateConceptSet = ko.observable(data.excludedCovariateConceptSet || {});
        }
    }
	return EstimationCovariateSettings;
});