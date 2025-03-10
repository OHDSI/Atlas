define(['knockout'], function (ko) {

	function DateOffsetStrategy(data, conceptSets) {
		var self = this;
		data = data || {};

		self.DateField = ko.observable(data.DateField || "StartDate");
		self.Offset = ko.observable(data.Offset || 0);
		self.OffsetUnitValue = ko.observable(data.OffsetUnitValue || 0);
		self.OffsetUnit = ko.observable(data.OffsetUnit || 'day');

		self.OffsetUnitValue.subscribe(function (newValue){
			const insertValue = newValue.toString().replace(/[\D\.]/g, '');
			self.OffsetUnitValue(insertValue ? Number(insertValue) : 0);
			self.OffsetUnit() === 'day' && self.Offset(insertValue ? Number(insertValue) : 0);
		})
		
		self.OffsetUnit.subscribe(function (newValue){
			self.Offset(newValue === 'day' ? self.OffsetUnitValue() : 0);
		})
	}

	DateOffsetStrategy.prototype.toJSON = function () {
		return this;
	}
	
	return DateOffsetStrategy;
	
});