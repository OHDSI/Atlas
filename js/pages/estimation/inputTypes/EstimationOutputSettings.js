define(function (require, exports) {

    var ko = require('knockout');
    var Analysis = require('./Analysis');

	function EstimationOutputSettings(data) {
		var self = this;
        data = data || {};
        
        self.analysisIds = ko.observableArray(data.analysisIds && data.analysisIds.map(function(d) { return new Analysis(d) }));
        self.produceDiagnostics = ko.observable(data.produceDiagnostics || true);
        self.blinded = ko.observable(data.blinded || true);
	}
	
	return EstimationOutputSettings;
});