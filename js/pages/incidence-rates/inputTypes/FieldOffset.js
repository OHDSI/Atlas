define(['knockout'], function (ko) {

	function FieldOffset(data) {
		var self = this;
		data = data || {};

		self.DateField = ko.observable(data.DateField || "StartDate");
		self.Offset = ko.observable(data.Offset || 0);
	}

	FieldOffset.prototype.toJSON = function () {
		return this;
	}
	
	return FieldOffset;
	
});