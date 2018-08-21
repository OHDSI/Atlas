define(function (require, exports) {

    var ko = require('knockout');

	function StratifyByPsArgs(data) {
		var self = this;
        data = data || {};
        
        self.numberOfStrata = ko.observable(data.numberOfStrata || 5);
        self.baseSelection = ko.observable(data.baseSelection || "all");
        self.stratificationColumns = (data.stratificationColumns && Array.isArray(data.stratificationColumns)) ? data.stratificationColumns : [];
        self.attr_class = data.attr_class || "args";
	}
	
	return StratifyByPsArgs;
});