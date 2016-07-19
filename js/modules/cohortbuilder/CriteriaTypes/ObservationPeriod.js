define(['knockout', '../InputTypes/Range','conceptpicker/InputTypes/Concept'], function (ko, Range, Concept) {
	function ObservationPeriod(data) {
		var self = this;
		data = data || {};

		self.First = ko.observable(data.First || null);
		self.PeriodStartDate = ko.observable(data.PeriodStartDate && new Range(data.PeriodStartDate));
		self.PeriodEndDate = ko.observable(data.PeriodEndDate && new Range(data.PeriodEndDate));
		self.PeriodType = ko.observable(data.PeriodType && ko.observableArray(data.PeriodType.map(function (d) {
			return new Concept(d);
		})));

		// Derived Fields
		self.AgeAtStart = ko.observable(data.AgeAtStart && new Range(data.AgeAtStart));
		self.AgeAtEnd = ko.observable(data.AgeAtEnd && new Range(data.AgeAtEnd));
		self.PeriodLength = ko.observable(data.PeriodLength && new Range(data.PeriodLength));
	}

	ObservationPeriod.prototype.toJSON = function () {
		return this;
	}
	return ObservationPeriod;
});