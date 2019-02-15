define([
	'knockout', 
	'databindings',
], function (
    ko
) {
	class DecisionTreeSettings {
        constructor(data = {}) {
            this.maxDepth = ko.observableArray((data.maxDepth && Array.isArray(data.maxDepth)) ? data.maxDepth : [10]);
            this.minSamplesSplit = ko.observableArray((data.minSamplesSplit && Array.isArray(data.minSamplesSplit)) ? data.minSamplesSplit : [2]);
            this.minSamplesLeaf = ko.observableArray((data.minSamplesLeaf && Array.isArray(data.minSamplesLeaf)) ? data.minSamplesLeaf : [10]);
            this.minImpurityDecrease = ko.observableArray((data.minImpurityDecrease && Array.isArray(data.minImpurityDecrease)) ? data.minImpurityDecrease : [0.0000001]);
            this.seed = ko.observable(data.seed || null);
            this.classWeight = ko.observable(data.classWeight || "None");
            this.plot = ko.observable(data.plot === undefined ? false : data.plot);
        }
    }
	
	return DecisionTreeSettings;
});