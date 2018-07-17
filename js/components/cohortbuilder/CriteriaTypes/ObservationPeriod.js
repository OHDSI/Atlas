define(['knockout', './Criteria', '../InputTypes/Range', '../InputTypes/Period', 'conceptpicker/InputTypes/Concept'], function (ko, Criteria, Range, Period, Concept) {
	function ObservationPeriod(data, conceptSets) {
		var self = this;
		data = data || {};

		Criteria.call(this, data, conceptSets);
		
		self.First = ko.observable(data.First || null);
		self.PeriodStartDate = ko.observable(data.PeriodStartDate && new Range(data.PeriodStartDate));
		self.PeriodEndDate = ko.observable(data.PeriodEndDate && new Range(data.PeriodEndDate));
		self.PeriodType = ko.observable(data.PeriodType && ko.observableArray(data.PeriodType.map(function (d) {
			return new Concept(d);
		})));
		self.UserDefinedPeriod = ko.observable(data.UserDefinedPeriod && new Period(data.UserDefinedPeriod));
		
		// Derived Fields
		self.AgeAtStart = ko.observable(data.AgeAtStart && new Range(data.AgeAtStart));
		self.AgeAtEnd = ko.observable(data.AgeAtEnd && new Range(data.AgeAtEnd));
		self.PeriodLength = ko.observable(data.PeriodLength && new Range(data.PeriodLength));
	}

	ObservationPeriod.prototype = new Criteria();
	ObservationPeriod.prototype.constructor = ObservationPeriod;
	ObservationPeriod.prototype.toJSON = function () {
		return this;
	}

	return ObservationPeriod;
});