define(['knockout'], function (ko) {

	function Window(data) {
		var self = this;
		data = data || {};

		self.Start = {
			Days: ko.observable(setDays(data.Start)),
			Coeff: ko.observable((data.Start && data.Start.Coeff) === 0 ? 0 : (data.Start && data.Start.Coeff) || -1),
			TimeUnit: ko.observable((data.Start && data.Start.TimeUnit) || 'day'),
			TimeUnitValue: ko.observable(setTimeUnitValue(data.Start))
		};
		
		self.End = {
			Days: ko.observable(setDays(data.End)),
			Coeff: ko.observable((data.End && data.End.Coeff) === 0 ? 0 : (data.End && data.End.Coeff) || 1),
			TimeUnit: ko.observable((data.End && data.End.TimeUnit) ||  'day'),
			TimeUnitValue: ko.observable(setTimeUnitValue(data.End))
		};
		
		self.UseIndexEnd = ko.observable(data.UseIndexEnd || false);
		self.UseEventEnd = ko.observable(data.UseEventEnd || false);

		self.Start.TimeUnitValue.subscribe(function (newValue){
			const insertValue = newValue ? newValue.toString().replace(/[\D\.]/g, '') : newValue.toString().trim() === '0' ? 0 : null;
			self.Start.TimeUnitValue(insertValue === null ? null : Number(insertValue));
			self.Start.TimeUnit() === 'day' &&	self.Start.Days(insertValue === null ? null : Number(insertValue));
		})

		self.End.TimeUnitValue.subscribe(function (newValue){
			const insertValue = newValue ? newValue.toString().replace(/[\D\.]/g, '') : newValue.toString().trim() === '0' ? 0 : null;
			self.End.TimeUnitValue(insertValue === null ? null : Number(insertValue));
			self.End.TimeUnit() === 'day' && self.End.Days(insertValue === null ? null : Number(insertValue));
		})

		self.Start.TimeUnit.subscribe(function (newValue){
			self.End.TimeUnit(newValue);
			self.Start.Days(newValue === 'day' ? (self.Start.TimeUnitValue() === 'All' ? null : self.Start.TimeUnitValue()) : null);
		})

		self.End.TimeUnit.subscribe(function (newValue){
			self.End.Days(newValue === 'day' ? (self.End.TimeUnitValue() === 'All' ? null : self.End.TimeUnitValue()) : null);
		})
		
	}

	function setDays(dateValue) {
		if (dateValue) {
			if (dateValue.Days === 0) {
				return 0;
			} else if (dateValue.Days) {
				return dateValue.Days;
			} else if (dateValue.TimeUnitValue === 0) {
				return 0;
			} else if (dateValue.TimeUnitValue && dateValue.TimeUnitValue !== 'All') {
				return dateValue.TimeUnitValue;
			}
		}
		return null;
	}

	function setTimeUnitValue(dateValue) {
		if (dateValue) {
			if (dateValue.TimeUnitValue === 0) {
				return 0;
			} else if (dateValue.TimeUnitValue && dateValue.TimeUnitValue !== 'All') {
				return dateValue.TimeUnitValue;
			} else if (dateValue.Days === 0) {
				return 0;
			} else if (dateValue.Days) {
				return dateValue.Days;
			}
		}
		return null;
	}

	return Window;
});