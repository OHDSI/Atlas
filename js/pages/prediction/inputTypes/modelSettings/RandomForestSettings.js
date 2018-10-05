define([
	'knockout', 
	'databindings',
], function (ko) {

	function RandomForestSettings(data) {
		var self = this;
        data = data || {};

        self.mtries = ko.observableArray((data.mtries && Array.isArray(data.mtries)) ? data.mtries : [-1]);
        self.ntrees = ko.observableArray((data.ntrees && Array.isArray(data.ntrees)) ? data.ntrees : [500]);
        self.maxDepth = ko.observableArray((data.maxDepth && Array.isArray(data.maxDepth)) ? data.maxDepth : []);
        self.varImp = ko.observable(data.varImp === undefined ? true : data.varImp);
        self.seed = ko.observable(data.seed || null);
    }
	
	return RandomForestSettings;
});