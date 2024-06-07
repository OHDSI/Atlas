define(['knockout'], function (ko) {

	function Window(data) {
		var self = this;
		data = data || {};

		self.Start = {
			Days: ko.observable((data.Start && data.Start.Days) === 0 ? 0 : (data.Start && data.Start.Days) || null),
			Coeff: ko.observable((data.Start && data.Start.Coeff) === 0 ? 0 : (data.Start && data.Start.Coeff) || -1),
			TimeUnit: ko.observable((data.Start && data.Start.TimeUnit) || 'day'),
			TimeUnitValue: ko.observable(setTimeUnitValue(data.Start))
		};
		
		self.End = {
			Days: ko.observable((data.End && data.End.Days) === 0 ? 0 : (data.End && data.End.Days) || null),
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
			self.Start.Days(newValue === 'day' ? self.Start.TimeUnitValue() : null);
		})

		self.End.TimeUnit.subscribe(function (newValue){
			self.End.Days(newValue === 'day' ? self.End.TimeUnitValue() : null);
		})
		
	}

	function setTimeUnitValue(value) {
		if (value) {
			if (value.TimeUnitValue === 0) {
				return 0;
			} else if (value.TimeUnitValue) {
				return value.TimeUnitValue;
			} else if (value.Days) {
				return value.Days;
			}
		}
	}

	return Window;
});