define(function (require, exports) {

    var ko = require('knockout');

	function Comparison(data) {
		var self = this;
        data = data || {};
        
        self.targetId = data.targetId || null;
        self.targetName = data.targetName || null;
        self.comparatorId = data.comparatorId || null;
        self.comparatorName = data.comparatorName || null;
        self.outcomeIds = (data.outcomeIds && Array.isArray(data.outcomeIds)) ? data.outcomeIds : [];
        self.negativeControlOutcomeIds = (data.negativeControlOutcomeIds && Array.isArray(data.negativeControlOutcomeIds)) ? data.negativeControlOutcomeIds : [];
        self.excludedCovariateConceptIds = (data.excludedCovariateConceptIds && Array.isArray(data.excludedCovariateConceptIds)) ? data.excludedCovariateConceptIds : [];
        self.includedCovariateConceptIds = (data.includedCovariateConceptIds && Array.isArray(data.includedCovariateConceptIds)) ? data.includedCovariateConceptIds : [];
	}
	
	return Comparison;
});