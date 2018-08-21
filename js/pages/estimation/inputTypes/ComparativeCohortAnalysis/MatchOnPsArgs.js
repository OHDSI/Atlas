define(function (require, exports) {

    var ko = require('knockout');

	function MatchOnPsArgs(data) {
		var self = this;
        data = data || {};
        
        self.caliper = ko.observable(data.caliper || 0.2);
        self.caliperScale = ko.observable(data.caliperScale || "standardized logit");
        self.stratificationColumns = (data.stratificationColumns && Array.isArray(data.stratificationColumns)) ? data.stratificationColumns : [];
        self.attr_class = data.attr_class || "args";
	}
	
	return MatchOnPsArgs;
});