define(function (require, exports) {
	var ko = require('knockout');

	function Analysis(data) {
		var self = this;
        data = data || {};
        
        self.id = ko.observable(data.id === 0 ? 0 : data.id || null);
        self.description = ko.observable(data.description || null);
	}
	
	return Analysis;
});