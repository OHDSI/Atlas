define(['knockout', './Criteria', '../InputTypes/Range','conceptpicker/InputTypes/Concept', '../InputTypes/Text'], function (ko, Criteria, Range, Concept, Text) {

	function LocationRegion(data, conceptSets) {
		var self = this;
		data = data || {};

		Criteria.call(this, data, conceptSets);

		conceptSets.subscribe(function (changes) {
			changes.forEach(function(change) {
				if (change.status === 'deleted') {
					if (ko.utils.unwrapObservable(self.CodesetId) == change.value.id)
						self.CodesetId(null);
				}
			});
		}, null, "arrayChange");

		// General Location Region Criteria

		self.CodesetId = ko.observable(data.CodesetId);

		self.StartDate = ko.observable(data.OccurrenceStartDate && new Range(data.StartDate));
		self.EndDate = ko.observable(data.OccurrenceEndDate && new Range(data.EndDate));
	}

	LocationRegion.prototype = new Criteria();
	LocationRegion.prototype.constructor = LocationRegion;
	LocationRegion.prototype.toJSON = function () {
		return this;
	}

	return LocationRegion;

});