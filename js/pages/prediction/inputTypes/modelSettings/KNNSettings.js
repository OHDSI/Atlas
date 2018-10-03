define([
	'knockout', 
	'databindings',
], function (ko) {

	function KNNSettings(data) {
		var self = this;
        data = data || {};

        self.k = ko.observable(data.k === 0 ? 0 : data.k || 1000);
    }
	
	return KNNSettings;
});