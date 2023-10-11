define(['knockout'], function (ko) {
	var debug = false;
	function DateAdjustment(data) {
		var self = this;
		data = data || {};

		self.StartWith = ko.observable(data.StartWith || DateAdjustment.START_DATE);
		self.StartOffset = ko.observable(data.StartOffset || 0);
		self.EndWith = ko.observable(data.EndWith || DateAdjustment.END_DATE);
		self.EndOffset = ko.observable(data.EndOffset || 0);
	}

    DateAdjustment.START_DATE = "START_DATE";
    DateAdjustment.END_DATE = "END_DATE";

	return DateAdjustment;
});