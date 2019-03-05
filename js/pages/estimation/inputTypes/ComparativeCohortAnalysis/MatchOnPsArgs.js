define([
	'knockout', 
    'services/analysis/RLangClass',
	'databindings',
], function (
    ko,
    RLangClass
) {
	class MatchOnPsArgs extends RLangClass {
        constructor(data = {}) {
            super();
            this.caliper = ko.observable(data.caliper === 0 ? 0 : data.caliper || 0.2).extend({ numeric: 2});
            this.caliperScale = ko.observable(data.caliperScale || "standardized logit");
            this.maxRatio = ko.observable(data.maxRatio === 0 ? 0 : data.maxRatio || 1).extend({ numeric: 0});
            this.stratificationColumns = (data.stratificationColumns && Array.isArray(data.stratificationColumns)) ? data.stratificationColumns : [];
        }
	}
	
	return MatchOnPsArgs;
});