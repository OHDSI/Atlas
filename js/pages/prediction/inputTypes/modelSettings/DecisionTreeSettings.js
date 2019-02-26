define([
	'knockout', 
	'databindings',
], function (
    ko
) {
	class DecisionTreeSettings {
        constructor(data = {}) {
            this.maxDepth = ko.observableArray((data.maxDepth && Array.isArray(data.maxDepth)) ? data.maxDepth.slice() : [10]);
            this.minSamplesSplit = ko.observableArray((data.minSamplesSplit && Array.isArray(data.minSamplesSplit)) ? data.minSamplesSplit.slice() : [2]);
            this.minSamplesLeaf = ko.observableArray((data.minSamplesLeaf && Array.isArray(data.minSamplesLeaf)) ? data.minSamplesLeaf.slice() : [10]);
            this.minImpurityDecrease = ko.observableArray((data.minImpurityDecrease && Array.isArray(data.minImpurityDecrease)) ? data.minImpurityDecrease.slice() : [0.0000001]);
            this.classWeight = ko.observableArray((data.classWeight && Array.isArray(data.classWeight)) ? data.classWeight.slice() : ["None"]);
            this.plot = ko.observable(data.plot === undefined ? false : data.plot);
        }
    }
	
	return DecisionTreeSettings;
});