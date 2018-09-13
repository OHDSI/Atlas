define(function (require, exports) {

    var ko = require('knockout');

	function AdaBoost(data) {
		var self = this;
        data = data || {};

        self.nEstimators = ko.observable(data.nEstimators || 50);
        self.learningRate = ko.observable(data.learningRate || 1);
        self.seed = ko.observable(data.seed || null);
    }
	
	return AdaBoost;
});