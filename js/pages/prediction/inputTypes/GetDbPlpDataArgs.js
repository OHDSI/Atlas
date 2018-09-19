define(function (require, exports) {

    var ko = require('knockout');

	function GetDbPLPDataArgs(data) {
		var self = this;
        data = data || {};

        self.washoutPeriod = ko.observable(data.washoutPeriod || 0);
        self.maxSampleSize = ko.observable(data.maxSampleSize || null);
	}
	
	return GetDbPLPDataArgs;
});