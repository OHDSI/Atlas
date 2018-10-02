define(function (require, exports) {

    var ko = require('knockout');

	function KNNSettings(data) {
		var self = this;
        data = data || {};

        self.k = ko.observable(data.k || 1000);
        self.indexFolder = ko.observable(data.indexFolder || null);
    }
	
	return KNNSettings;
});