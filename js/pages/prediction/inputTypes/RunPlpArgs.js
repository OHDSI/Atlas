define([
	'knockout', 
	'databindings',
], function (
    ko
) {
	class RunPlpArgs {
        constructor(data = {}) {
            this.minCovariateFraction = ko.observable(data.minCovariateFraction === 0 ? 0 : data.minCovariateFraction || 0.001).extend({numeric: 5});
            this.normalizeData = ko.observable(data.normalizeData === undefined ? true : data.normalizeData);
            this.testSplit = ko.observable(data.testSplit || "person");
            this.testFraction = ko.observable(data.testFraction === 0 ? 0 : data.testFraction || 0.25).extend({numeric: 2});
            this.splitSeed = ko.observable(data.splitSeed || null).extend({numeric: 0});
            this.nfold = ko.observable(data.nfold || 3);
        }
	}
	
	return RunPlpArgs;
});