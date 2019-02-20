define([
	'knockout',
], function (
	ko
) {
	class FullAnalysis {
        constructor(targetComparatorOutcome, cohortMethodAnalysis) {
            this.targetComparatorOutcome = targetComparatorOutcome || null;
            this.cohortMethodAnalysis = cohortMethodAnalysis || null;
        }
	}
	
	return FullAnalysis;
});