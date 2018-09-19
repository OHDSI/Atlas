define(function (require, exports) {

    var ko = require('knockout');

	function DecisionTreeSettings(data) {
		var self = this;
        data = data || {};

        self.maxDepth = ko.observable(data.maxDepth || 10);
        self.minSamplesSplit = ko.observable(data.minSamplesSplit || 2);
        self.minSamplesLeaf = ko.observable(data.minSamplesLeaf || 10);
        self.minImpurityDecrease = ko.observable(data.minImpurityDecrease || 0.0000001);
        self.seed = ko.observable(data.seed || null);
        self.classWeight = ko.observable(data.classWeight || "None");
        self.plot = ko.observable(data.plot || false);
    }
	
	return DecisionTreeSettings;
});