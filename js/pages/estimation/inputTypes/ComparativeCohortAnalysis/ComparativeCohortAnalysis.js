define(function (require, exports) {
    var ko = require('knockout');
   var TargetComparatorOutcomes = require('../TargetComparatorOutcomes');
   var CohortMethodAnalysis = require('./CohortMethodAnalysis');

	function ComparativeCohortAnalysis(data, defaultCovariateSettings) {
		var self = this;
        data = data || {};
        
        self.targetComparatorOutcomes = ko.observableArray(data.targetComparatorOutcomes && data.targetComparatorOutcomes.map(function(d) { return new TargetComparatorOutcomes(d) }));
        self.cohortMethodAnalysisList = ko.observableArray(data.cohortMethodAnalysisList && data.cohortMethodAnalysisList.map(function(d) { return new CohortMethodAnalysis(d, defaultCovariateSettings) }));
	}
	
	return ComparativeCohortAnalysis;
});