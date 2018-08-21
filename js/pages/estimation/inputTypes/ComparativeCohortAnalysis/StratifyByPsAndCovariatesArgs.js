define(function (require, exports) {

    var ko = require('knockout');

	function StratifyByPsAndCovariatesArgs(data) {
		var self = this;
		data = data || {};
		
        self.numberOfStrata = ko.observable(data.numberOfStrata || 5);
        self.baseSelection = ko.observable(data.baseSelection || "all");
		self.covariateIds = (data.covariateIds && Array.isArray(data.covariateIds)) ? data.covariateIds : [];
        self.attr_class = data.attr_class || "args";		
	}
	
	return StratifyByPsAndCovariatesArgs;
});