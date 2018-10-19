define(function (require, exports) {

	function FullAnalysis(targetComparatorOutcome, cohortMethodAnalysis) {
        var self = this;
                
        self.targetComparatorOutcome = targetComparatorOutcome || null;
        self.cohortMethodAnalysis = cohortMethodAnalysis || null;
	}
	
	return FullAnalysis;
});