define([
	'knockout', 
	'databindings',
], function (ko) {

	function MLPSettings(data) {
		var self = this;
        data = data || {};

        self.size = ko.observableArray((data.size && Array.isArray(data.size)) ? data.size : [4]);
        self.alpha = ko.observableArray((data.alpha && Array.isArray(data.alpha)) ? data.alpha : [0.00001]);
        self.seed = ko.observable(data.seed || null);
    }
	
	return MLPSettings;
});