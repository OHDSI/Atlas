define(['knockout'], function (ko) {

	function FieldOffset(data, defaultDateField = 'StartDate', defaultOffset = 0) {
		var self = this;
		data = data || {};

		self.DateField = ko.observable(data.DateField || defaultDateField);
		self.Offset = ko.observable(data.Offset || defaultOffset);
	}

	FieldOffset.prototype.toJSON = function () {
		return this;
	}
	
	return FieldOffset;
	
});