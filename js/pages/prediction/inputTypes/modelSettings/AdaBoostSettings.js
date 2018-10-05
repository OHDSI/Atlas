define([
	'knockout', 
	'databindings',
], function (ko) {

	function AdaBoostSettings(data) {
		var self = this;
        data = data || {};

        self.nEstimators = ko.observableArray((data.nEstimators && Array.isArray(data.nEstimators)) ? data.nEstimators : [50]);
        self.learningRate = ko.observableArray((data.learningRate && Array.isArray(data.learningRate)) ? data.learningRate : [1]);
        self.seed = ko.observable(data.seed || null);
    }
	
	return AdaBoostSettings;
});