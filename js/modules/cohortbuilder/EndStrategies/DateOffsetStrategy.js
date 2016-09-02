define(['knockout'], function (ko) {

	function DateOffsetStrategy(data, conceptSets) {
		var self = this;
		data = data || {};

		self.DateField = ko.observable(data.DateField || "StartDate");
		self.Offset = ko.observable(data.Offset || 0);
	}

	DateOffsetStrategy.prototype.toJSON = function () {
		return this;
	}
	
	return DateOffsetStrategy;
	
});