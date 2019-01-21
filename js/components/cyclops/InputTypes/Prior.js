define([
	'knockout', 
    'services/analysis/RLangClass',
	'databindings',
], function (
    ko,
    RLangClass
) {
    class Prior extends RLangClass {
        constructor(data = {}) {
            super({"attr_class": "cyclopsPrior"});
            this.priorType = ko.observable(data.priorType || "laplace");
            this.variance = ko.observable(data.variance === 0 ? 1 : data.variance || 1).extend({numeric: 0});
            this.exclude = ko.observable(data.exclude === 0 ? 0 : data.exclude || 0).extend({numeric: 0});
            this.graph = ko.observable(data.graph === 0 ? null : data.graph || null);
            this.neighborhood = ko.observable(data.neighborhood === 0 ? null : data.neighborhood || null);
            this.useCrossValidation = ko.observable(data.useCrossValidation === 0 ? false : data.useCrossValidation || false);
            this.forceIntercept = ko.observable(data.forceIntercept === 0 ? false : data.forceIntercept || false);
        }
	}
	
	return Prior;
});