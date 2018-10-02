define(['knockout'], function (ko) {

	function Prior(data) {
		var self = this;
		data = data || {};

        self.priorType = ko.observable(data.priorType || "laplace");
        self.variance = ko.observable(data.variance === 0 ? 1 : data.variance || 1);
        self.exclude = ko.observable(data.exclude === 0 ? 0 : data.exclude || 0);
        self.graph = ko.observable(data.graph === 0 ? null : data.graph || null);
        self.neighborhood = ko.observable(data.neighborhood === 0 ? null : data.neighborhood || null);
        self.useCrossValidation = ko.observable(data.useCrossValidation === 0 ? false : data.useCrossValidation || false);
        self.forceIntercept = ko.observable(data.forceIntercept === 0 ? false : data.forceIntercept || false);
        self.attr_class = data.attr_class || "cyclopsPrior";
	}
	
	return Prior;
});