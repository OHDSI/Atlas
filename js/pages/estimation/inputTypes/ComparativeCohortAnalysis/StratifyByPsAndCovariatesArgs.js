define([
	'knockout', 
	'databindings',
], function (ko) {

	function StratifyByPsAndCovariatesArgs(data) {
		var self = this;
		data = data || {};
		
        self.numberOfStrata = ko.observable(data.numberOfStrata === 0 ? 0 : data.numberOfStrata || 5).extend({ numeric: 0});
        self.baseSelection = ko.observable(data.baseSelection || "all");
		self.covariateIds = (data.covariateIds && Array.isArray(data.covariateIds)) ? data.covariateIds : [];
        self.attr_class = data.attr_class || "args";		
	}
	
	return StratifyByPsAndCovariatesArgs;
});