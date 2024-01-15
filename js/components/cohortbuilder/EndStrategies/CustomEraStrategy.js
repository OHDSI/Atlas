define(['knockout'], function (ko) {

	function CustomEraStrategy(data, conceptSets) {
		var self = this;
		data = data || {};

		self.DrugCodesetId = ko.observable(data.DrugCodesetId);
		self.GapDays = ko.observable(data.GapDays || 0);
		self.GapUnit = ko.observable(data.GapUnit || 'day');
		self.GapUnitValue = ko.observable(data.GapUnitValue || 0);
		self.Offset = ko.observable(data.Offset || 0);
		self.OffsetUnitValue = ko.observable(data.OffsetUnitValue || 0);
		self.OffsetUnit = ko.observable(data.OffsetUnit || 'day');
		self.DaysSupplyOverride = ko.observable(data.DaysSupplyOverride);
		
		// set up subscription to update DrugCodesetId if the item is removed from conceptSets
		conceptSets.subscribe(function (changes) {
			changes.forEach(function(change) {
				if (change.status === 'deleted') {
					if (ko.utils.unwrapObservable(self.DrugCodesetId) == change.value.id)
						self.DrugCodesetId(null);
				}
			});
		}, null, "arrayChange");	
		
		self.OffsetUnitValue.subscribe(function (newValue){
			const insertValue = newValue.toString().replace(/[\D\.]/g, '');
			self.OffsetUnitValue(insertValue ? Number(insertValue) : 0);
			self.OffsetUnit() === 'day' && self.Offset(insertValue ? Number(insertValue) : 0);
		})

		self.OffsetUnit.subscribe(function (newValue){
			self.GapUnit(newValue);
			self.Offset(newValue === 'day' ? self.OffsetUnitValue() : 0);
		})

		self.GapUnitValue.subscribe(function (newValue){
			const insertValue = newValue.toString().replace(/[\D\.]/g, '');
			self.GapUnitValue(insertValue ? Number(insertValue) : 0);
			self.GapUnit() === 'day' && self.GapDays(insertValue ? Number(insertValue) : 0);
		})

		self.GapUnit.subscribe(function (newValue){
			self.OffsetUnit(newValue);
			self.GapDays(newValue === 'day' ? self.GapUnitValue() : 0);
		})
	}

	CustomEraStrategy.prototype.toJSON = function () {
		return this;
	}
	
	return CustomEraStrategy;
	
});