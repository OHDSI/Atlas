define([
	'knockout', 
	'databindings',
], function (ko) {

	function DecisionTreeSettings(data) {
		var self = this;
        data = data || {};

        self.maxDepth = ko.observableArray((data.maxDepth && Array.isArray(data.maxDepth)) ? data.maxDepth : [10]);
        self.minSamplesSplit = ko.observableArray((data.minSamplesSplit && Array.isArray(data.minSamplesSplit)) ? data.minSamplesSplit : [2]);
        self.minSamplesLeaf = ko.observableArray((data.minSamplesLeaf && Array.isArray(data.minSamplesLeaf)) ? data.minSamplesLeaf : [10]);
        self.minImpurityDecrease = ko.observableArray((data.minImpurityDecrease && Array.isArray(data.minImpurityDecrease)) ? data.minImpurityDecrease : [0.0000001]);
        self.seed = ko.observable(data.seed || null);
        self.classWeight = ko.observable(data.classWeight || "None");
        self.plot = ko.observable(data.plot === undefined ? false : data.plot);
    }
	
	return DecisionTreeSettings;
});