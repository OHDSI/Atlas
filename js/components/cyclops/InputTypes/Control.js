define([
    'knockout', 
    'services/analysis/RLangClass',
	'databindings',
], 
function (
    ko,
    RLangClass
) {
	class Control extends RLangClass {
        constructor(data = {}) {
            super({"attr_class": "cyclopsControl"});
            this.maxIterations = ko.observable(data.maxIterations === 0 ? 1000 : data.maxIterations || 1000).extend({numeric: 0});
            this.tolerance = ko.observable(data.tolerance === 0 ? .000001 : data.tolerance || .000001).extend({numeric: 7});
            this.convergenceType = ko.observable(data.convergenceType === 0 ? "gradient" : data.convergenceType || "gradient");
            this.cvType = ko.observable(data.cvType === 0 ? "auto" : data.cvType || "auto");
            this.fold = ko.observable(data.fold === 0 ? 10 : data.fold || 10).extend({numeric: 0});
            this.lowerLimit = ko.observable(data.lowerLimit === 0 ? 0.01 : data.lowerLimit || 0.01).extend({numeric: 2});
            this.upperLimit = ko.observable(data.upperLimit === 0 ? 20 : data.upperLimit || 20).extend({numeric: 2});
            this.gridSteps = ko.observable(data.gridSteps === 0 ? 10 : data.gridSteps || 10).extend({numeric: 0});
            this.cvRepetitions = ko.observable(data.cvRepetitions === 0 ? 1 : data.cvRepetitions || 1).extend({numeric: 0});
            this.minCVData = ko.observable(data.minCVData === 0 ? 100 : data.minCVData || 100).extend({numeric: 0});
            this.noiseLevel = ko.observable(data.noiseLevel === 0 ? "silent" : data.noiseLevel || "silent");
            this.seed = ko.observable(data.seed === 0 ? null : data.seed || null).extend({numeric: 0});
            this.resetCoefficients = ko.observable(data.resetCoefficients === 0 ? false : data.resetCoefficients || false);
            this.startingVariance = ko.observable(data.startingVariance === 0 ? -1 : data.startingVariance || -1).extend({numeric: 2});
            this.useKKTSwindle = ko.observable(data.useKKTSwindle === 0 ? false : data.useKKTSwindle || false);
            this.tuneSwindle = ko.observable(data.tuneSwindle === 0 ? 10 : data.tuneSwindle || 10).extend({numeric: 0});
            this.selectorType = ko.observable(data.selectorType === 0 ? "auto" : data.selectorType || "auto");
            this.initialBound = ko.observable(data.initialBound === 0 ? 2 : data.initialBound || 2).extend({numeric: 5});
            this.maxBoundCount = ko.observable(data.maxBoundCount === 0 ? 5 : data.maxBoundCount || 5).extend({numeric: 0});
            this.autoSearch = ko.observable(data.autoSearch === 0 ? true : data.autoSearch || true);
            this.algorithm = ko.observable(data.algorithm == null ? "ccd" : data.algorithm);
        }
	}
	
	return Control;
});