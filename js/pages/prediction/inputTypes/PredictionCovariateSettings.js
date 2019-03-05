define([
    'knockout', 
    'featureextraction/InputTypes/CovariateSettings',
    'services/analysis/ConceptSet',
], function (
    ko,
    CovariateSettings,
    ConceptSet
){
    class PredictionCovariateSettings extends CovariateSettings {
        constructor(data) {
            super(data);
            this.includedCovariateConceptSet = ko.observable(data.includedCovariateConceptSet !== null ? new ConceptSet(data.includedCovariateConceptSet) : new ConceptSet());
            this.excludedCovariateConceptSet = ko.observable(data.excludedCovariateConceptSet !== null ? new ConceptSet(data.excludedCovariateConceptSet) : new ConceptSet());
        }
    }
	return PredictionCovariateSettings;
});