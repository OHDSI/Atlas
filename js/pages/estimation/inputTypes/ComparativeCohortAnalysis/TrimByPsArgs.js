define([
	'knockout', 
	'databindings',
], function (ko) {

    var ko = require('knockout');

	function TrimByPsArgs(data) {
		var self = this;
        data = data || {};
        
		self.trimFraction = ko.observable(data.trimFraction || 0.05).extend({ numeric: 2});
        self.attr_class = data.attr_class || "args";		
	}
	
	return TrimByPsArgs;
});