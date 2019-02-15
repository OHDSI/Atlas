define([
	'knockout', 
	'databindings',
], function (
    ko
) {
	class RandomForestSettings {
        constructor(data = {}) {
            this.mtries = ko.observableArray((data.mtries && Array.isArray(data.mtries)) ? data.mtries : [-1]);
            this.ntrees = ko.observableArray((data.ntrees && Array.isArray(data.ntrees)) ? data.ntrees : [500]);
            this.maxDepth = ko.observableArray((data.maxDepth && Array.isArray(data.maxDepth)) ? data.maxDepth : []);
            this.varImp = ko.observable(data.varImp === undefined ? true : data.varImp);
            this.seed = ko.observable(data.seed || null);
        }
    }
	
	return RandomForestSettings;
});