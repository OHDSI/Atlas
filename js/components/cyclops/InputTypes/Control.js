define(['knockout'], function (ko) {

	function Control(data) {
		var self = this;
		data = data || {};

        self.maxIterations = ko.observable(data.maxIterations === 0 ? 1000 : data.maxIterations || 1000);
        self.tolerance = ko.observable(data.tolerance === 0 ? .000001 : data.tolerance || .000001);
        self.convergenceType = ko.observable(data.convergenceType === 0 ? "gradient" : data.convergenceType || "gradient");
        self.cvType = ko.observable(data.cvType === 0 ? "auto" : data.cvType || "auto");
        self.fold = ko.observable(data.fold === 0 ? 10 : data.fold || 10);
        self.lowerLimit = ko.observable(data.lowerLimit === 0 ? 0.01 : data.lowerLimit || 0.01);
        self.upperLimit = ko.observable(data.upperLimit === 0 ? 20 : data.upperLimit || 20);
        self.gridSteps = ko.observable(data.gridSteps === 0 ? 10 : data.gridSteps || 10);
        self.cvRepetitions = ko.observable(data.cvRepetitions === 0 ? 1 : data.cvRepetitions || 1);
        self.minCVData = ko.observable(data.minCVData === 0 ? 100 : data.minCVData || 100);
        self.noiseLevel = ko.observable(data.noiseLevel === 0 ? "silent" : data.noiseLevel || "silent");
        self.threads = ko.observable(data.threads === 0 ? 1 : data.threads || 1);
        self.seed = ko.observable(data.seed === 0 ? null : data.seed || null);
        self.resetCoefficients = ko.observable(data.resetCoefficients === 0 ? false : data.resetCoefficients || false);
        self.startingVariance = ko.observable(data.startingVariance === 0 ? -1 : data.startingVariance || -1);
        self.useKKTSwindle = ko.observable(data.useKKTSwindle === 0 ? false : data.useKKTSwindle || false);
        self.tuneSwindle = ko.observable(data.tuneSwindle === 0 ? 10 : data.tuneSwindle || 10);
        self.selectorType = ko.observable(data.selectorType === 0 ? "auto" : data.selectorType || "auto");
        self.initialBound = ko.observable(data.initialBound === 0 ? 2 : data.initialBound || 2);
        self.maxBoundCount = ko.observable(data.maxBoundCount === 0 ? 5 : data.maxBoundCount || 5);
        self.attr_class = data.attr_class || "cyclopsControl";
	}
	
	return Control;
});