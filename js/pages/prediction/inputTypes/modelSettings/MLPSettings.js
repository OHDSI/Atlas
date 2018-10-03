define([
	'knockout', 
	'databindings',
], function (ko) {

	function MLPSettings(data) {
		var self = this;
        data = data || {};

        self.size = ko.observable(data.size === 0 ? 0 : data.size || 4);
        self.alpha = ko.observable(data.ntrees === 0 ? 0 : data.ntrees || 0.00001);
        self.seed = ko.observable(data.seed || null);
    }
	
	return MLPSettings;
});