define([
	'knockout', 
    'services/analysis/RLangClass',
	'databindings',
], function (
	ko,
	RLangClass
) {
	class StratifyByPsAndCovariatesArgs extends RLangClass {
		constructor(data = {}) {
			super();
			this.numberOfStrata = ko.observable(data.numberOfStrata === 0 ? 0 : data.numberOfStrata || 5).extend({ numeric: 0});
			this.baseSelection = ko.observable(data.baseSelection || "all");
			this.covariateIds = (data.covariateIds && Array.isArray(data.covariateIds)) ? data.covariateIds : [];
		}
	}
	
	return StratifyByPsAndCovariatesArgs;
});