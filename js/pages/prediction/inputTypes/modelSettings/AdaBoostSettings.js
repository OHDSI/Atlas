define([
	'knockout', 
	'databindings',
], function (
    ko
) {
	class AdaBoostSettings {
        constructor(data = {}) {
            this.nEstimators = ko.observableArray((data.nEstimators && Array.isArray(data.nEstimators)) ? data.nEstimators.slice() : [50]);
            this.learningRate = ko.observableArray((data.learningRate && Array.isArray(data.learningRate)) ? data.learningRate.slice() : [1]);
            this.seed = ko.observable(data.seed || null);
        }
    }
	
	return AdaBoostSettings;
});