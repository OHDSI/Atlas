define([
	'knockout', 
	'databindings',
], function (ko) {

	function GetDbPLPDataArgs(data) {
		var self = this;
        data = data || {};

        self.washoutPeriod = ko.observable(data.washoutPeriod === 0 ? 0 : data.washoutPeriod || 0).extend({numeric: 0});
        self.maxSampleSize = ko.observable(data.maxSampleSize || null);
	}
	
	return GetDbPLPDataArgs;
});