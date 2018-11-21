define(function (require, exports) {
    var ko = require('knockout');
   var ComparativeCohortAnalysis = require('./ComparativeCohortAnalysis/ComparativeCohortAnalysis');

	function EstimationAnalysisSettings(data, estimationType, defaultCovariateSettings) {
		var self = this;
        data = data || {};
        
        self.GetAnalysisObject = function(estimationType, analysisSpecification) {
            var result;
            
            if (estimationType == "ComparativeCohortAnalysis") {
                return new ComparativeCohortAnalysis(analysisSpecification, defaultCovariateSettings);
            } else {
                console.error("estimationType property not set on Estimation Analysis and cannot initialize properly.")
            }
        }

        self.estimationType = (data.estimationType || estimationType);
        const analysis = self.GetAnalysisObject(self.estimationType, data.analysisSpecification);
        self.analysisSpecification = analysis;
	}
	
	return EstimationAnalysisSettings;
});