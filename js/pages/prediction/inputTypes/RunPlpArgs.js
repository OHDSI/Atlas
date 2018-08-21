define(function (require, exports) {

    var ko = require('knockout');

	function RunPlpArgs(data) {
		var self = this;
        data = data || {};

        self.minCovariateFraction = ko.observable(data.minCovariateFraction || 0.001);
        self.normalizeData = ko.observable(data.normalizeData || true);
        self.testSplit = ko.observable(data.testSplit || "time");
        self.testFraction = ko.observable(data.testFraction || 0.25);
        self.splitSeed = ko.observable(data.splitSeed || null);
        self.nfold = ko.observable(data.nfold || 3);
        self.indexes = ko.observableArray(self.indexes);
        self.savePlpData = ko.observable(data.savePlpData || true);
        self.savePlpResults = ko.observable(data.savePlpResults || true)
        self.savePlpPlots = ko.observable(data.savePlpPlots || true);
        self.saveEvaluation = ko.observable(data.saveEvaluation || true);
        self.attr_class = data.attr_class || "args";   
	}
	
	return RunPlpArgs;
});