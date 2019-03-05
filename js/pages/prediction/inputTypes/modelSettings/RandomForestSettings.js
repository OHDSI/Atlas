define([
	'knockout', 
	'databindings',
], function (
    ko
) {
	class RandomForestSettings {
        constructor(data = {}) {
            this.mtries = ko.observableArray((data.mtries && Array.isArray(data.mtries)) ? data.mtries.slice() : [-1]);
            this.ntrees = ko.observableArray((data.ntrees && Array.isArray(data.ntrees)) ? data.ntrees.slice() : [500]);
            this.maxDepth = ko.observableArray((data.maxDepth && Array.isArray(data.maxDepth)) ? data.maxDepth.slice() : []);
            this.varImp = ko.observableArray((data.varImp && Array.isArray(data.varImp)) ? data.varImp.slice() : [true]);
            this.seed = ko.observable(data.seed || null);
        }
    }
	
	return RandomForestSettings;
});