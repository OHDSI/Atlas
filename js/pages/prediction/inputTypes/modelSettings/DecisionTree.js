define(function (require, exports) {

    var ko = require('knockout');

	function DecisionTree(data) {
		var self = this;
        data = data || {};

        self.maxDepth = ko.observable(data.maxDepth || 10);
        self.minSampleSplit = ko.observable(data.minSampleSplit || 2);
        self.minSampleLeaf = ko.observable(data.minSampleLeaf || 10);
        self.minImpurityDecrease = ko.observable(data.nthread || 0.0000001);
        self.seed = ko.observable(data.seed || null);
        self.classWeight = ko.observable(data.classWeight || "None");
        self.plot = ko.observable(data.plot || false);
    }
	
	return DecisionTree;
});