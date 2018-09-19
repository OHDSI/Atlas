define(function (require, exports) {

    var ko = require('knockout');

	function GradientBoostingMachineSettings(data) {
		var self = this;
        data = data || {};

        self.ntrees = ko.observableArray((data.ntrees && Array.isArray(data.ntrees)) ? data.ntrees : []);
        self.nthread = ko.observable(data.nthread || 20);
        self.maxDepth = ko.observableArray((data.maxDepth && Array.isArray(data.maxDepth)) ? data.maxDepth : []);
        self.minRows = ko.observable(data.minRows || 20);
        self.learnRate = ko.observableArray((data.learnRate && Array.isArray(data.learnRate)) ? data.learnRate : []);
        self.seed = ko.observable(data.seed || null);
    }
	
	return GradientBoostingMachineSettings;
});