define([
	'knockout', 
	'databindings',
], function (ko) {

	function TrimByPsToEquipoiseArgs(data) {
		var self = this;
        data = data || {};

		self.bounds = ko.observableArray(data.bounds || [0.25, 0.75]);
        self.attr_class = data.attr_class || "args";
	}
	
	return TrimByPsToEquipoiseArgs;
});