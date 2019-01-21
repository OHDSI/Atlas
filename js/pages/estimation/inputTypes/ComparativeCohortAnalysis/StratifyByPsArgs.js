define([
	'knockout', 
    'services/analysis/RLangClass',
	'databindings',
], function (
	ko,
	RLangClass
) {
	class StratifyByPsArgs extends RLangClass {
		constructor(data = {}) {
			super();
			this.numberOfStrata = ko.observable(data.numberOfStrata === 0 ? 0 : data.numberOfStrata || 5).extend({ numeric: 0});
			this.baseSelection = ko.observable(data.baseSelection || "all");
			this.stratificationColumns = (data.stratificationColumns && Array.isArray(data.stratificationColumns)) ? data.stratificationColumns : [];
		}
	}
	
	return StratifyByPsArgs;
});