define(function (require, exports) {

    var ko = require('knockout');

	function RandomForestSettings(data) {
		var self = this;
        data = data || {};

        self.mtries = ko.observable(data.mtries || -1);
        self.ntrees = ko.observable(data.ntrees || 500);
        self.maxDepth = ko.observableArray((data.maxDepth && Array.isArray(data.maxDepth)) ? data.maxDepth : []);
        self.varImp = ko.observable(data.varImp || true);
        self.seed = ko.observable(data.seed || null);
    }
	
	return RandomForestSettings;
});