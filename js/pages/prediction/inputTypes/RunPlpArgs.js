define(function (require, exports) {

    var ko = require('knockout');

	function RunPlpArgs(data) {
		var self = this;
        data = data || {};

        self.minCovariateFraction = ko.observable(data.minCovariateFraction === 0 ? 0 : data.minCovariateFraction || 0.001).extend({numeric: 5});
        self.normalizeData = ko.observable(data.normalizeData === undefined ? true : data.normalizeData);
        self.testSplit = ko.observable(data.testSplit || "person");
        self.testFraction = ko.observable(data.testFraction === 0 ? 0 : data.testFraction || 0.25).extend({numeric: 2});
        self.splitSeed = ko.observable(data.splitSeed || null);
        self.nfold = ko.observable(data.nfold || 3);
	}
	
	return RunPlpArgs;
});