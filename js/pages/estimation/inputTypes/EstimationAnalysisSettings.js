define(function (require, exports) {

    var ko = require('knockout');
    var ComparativeCohortAnalysis = require('./ComparativeCohortAnalysis/ComparativeCohortAnalysis');

	function EstimationAnalysisSettings(data) {
		var self = this;
        data = data || {};
        
        self.GetAnalysisObject = function(estimationType, analysisSpecification) {
            var result;
            
            if (estimationType == "ComparativeCohortAnalysis") {
                return new ComparativeCohortAnalysis(analysisSpecification);
            } else {
                console.error("estimationType property not set on Estimation Analysis and cannot initialize properly.")
            }
        }

        self.estimationType = (data.estimationType || "ComparativeCohortAnalysis");
        const analysis = self.GetAnalysisObject(self.estimationType, data.analysisSpecification);
        self.analysisSpecification = analysis;
	}
	
	return EstimationAnalysisSettings;
});