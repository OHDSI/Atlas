define(function (require, exports) {

    var ko = require('knockout');
    var ComparativeCohortAnalysis = require('./ComparativeCohortAnalysis/ComparativeCohortAnalysis');

	function EstimationAnalysisSettings(data) {
		var self = this;
        data = data || {};
        
        self.estimationType = ko.observable(data.estimationType || "ComparativeCohortAnalysis");
        self.analysisSpecification = ko.observable(new ComparativeCohortAnalysis(data.analysisSpecification)); // TODO: Make this dynamic to support various types of estimation studies
	}
	
	return EstimationAnalysisSettings;
});