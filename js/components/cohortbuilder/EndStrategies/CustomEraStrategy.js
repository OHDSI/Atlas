define(['knockout'], function (ko) {

	function CustomEraStrategy(data, conceptSets) {
		var self = this;
		data = data || {};

		self.DrugCodesetId = ko.observable(data.DrugCodesetId);
		self.GapDays = ko.observable(data.GapDays || 0);
		self.Offset = ko.observable(data.Offset || 0);
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
	}

	CustomEraStrategy.prototype.toJSON = function () {
		return this;
	}
	
	return CustomEraStrategy;
	
});