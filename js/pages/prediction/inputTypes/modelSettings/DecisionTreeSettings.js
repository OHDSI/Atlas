define([
	'knockout', 
	'databindings',
], function (ko) {

	function DecisionTreeSettings(data) {
		var self = this;
        data = data || {};

        self.maxDepth = ko.observable(data.maxDepth === 0 ? 0 : data.maxDepth || 10);
        self.minSamplesSplit = ko.observable(data.minSamplesSplit === 0 ? 0 : data.minSamplesSplit || 2);
        self.minSamplesLeaf = ko.observable(data.minSamplesLeaf === 0 ? 0 : data.minSamplesLeaf || 10);
        self.minImpurityDecrease = ko.observable(data.minImpurityDecrease === 0 ? 0 : data.minImpurityDecrease || 0.0000001);
        self.seed = ko.observable(data.seed || null);
        self.classWeight = ko.observable(data.classWeight || "None");
        self.plot = ko.observable(data.plot === undefined ? false : data.plot);
    }
	
	return DecisionTreeSettings;
});