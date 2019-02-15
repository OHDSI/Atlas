define([
	'knockout',
    '../TargetComparatorOutcomes',
    './CohortMethodAnalysis'
 ], function (
	ko,
    TargetComparatorOutcomes,
    CohortMethodAnalysis
 ) {
	class ComparativeCohortAnalysis {
        constructor(data = {}, defaultCovariateSettings) {
            this.targetComparatorOutcomes = ko.observableArray(data.targetComparatorOutcomes && data.targetComparatorOutcomes.map(function(d) { return new TargetComparatorOutcomes(d) }));
            this.cohortMethodAnalysisList = ko.observableArray(data.cohortMethodAnalysisList && data.cohortMethodAnalysisList.map(function(d) { return new CohortMethodAnalysis(d, defaultCovariateSettings) }));
        }
	}
	
	return ComparativeCohortAnalysis;
});