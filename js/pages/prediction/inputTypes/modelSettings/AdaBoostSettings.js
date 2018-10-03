define([
	'knockout', 
	'databindings',
], function (ko) {

	function AdaBoostSettings(data) {
		var self = this;
        data = data || {};

        self.nEstimators = ko.observable(data.nEstimators === 0 ? 0 : data.nEstimators || 50);
        self.learningRate = ko.observable(data.learningRate === 0 ? 0 : data.learningRate || 1).extend({numeric: 3});
        self.seed = ko.observable(data.seed || null);
    }
	
	return AdaBoostSettings;
});