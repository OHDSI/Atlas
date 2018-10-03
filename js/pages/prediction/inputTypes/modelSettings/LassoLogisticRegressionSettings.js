define([
	'knockout', 
	'databindings',
], function (ko) {

	function LassoLogisticRegressionSettings(data) {
		var self = this;
        data = data || {};

        self.variance = ko.observable(data.variance === 0 ? 0 : data.variance || 0.01);
        self.seed = ko.observable(data.seed || null);
    }
	
	return LassoLogisticRegressionSettings;
});