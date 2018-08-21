define(function (require, exports) {

    var ko = require('knockout');

	function LassoLogisticRegression(data) {
		var self = this;
        data = data || {};

        self.variance = ko.observable(data.variance || 0.01);
        self.seed = ko.observable(data.seed || null);
    }
	
	return LassoLogisticRegression;
});