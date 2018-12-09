define(['knockout', './Criteria', '../InputTypes/Range','conceptpicker/InputTypes/Concept', '../InputTypes/Text'], function (ko, Criteria, Range, Concept, Text) {

	function LocationArea(data, conceptSets) {
		var self = this;
		data = data || {};

		Criteria.call(this, data, conceptSets);

		// set up subscription to update CodesetId and DrugSourceConcept if the item is removed from conceptSets
		conceptSets.subscribe(function (changes) {
			changes.forEach(function(change) {
				if (change.status === 'deleted') {
					if (ko.utils.unwrapObservable(self.CodesetId) == change.value.id)
						self.CodesetId(null);
				}
			});
		}, null, "arrayChange");

		// General Location Area Criteria

		self.CodesetId = ko.observable(data.CodesetId);

		self.StartDate = ko.observable(data.OccurrenceStartDate && new Range(data.StartDate));
		self.EndDate = ko.observable(data.OccurrenceEndDate && new Range(data.EndDate));
	}

	LocationArea.prototype = new Criteria();
	LocationArea.prototype.constructor = LocationArea;
	LocationArea.prototype.toJSON = function () {
		return this;
	}

	return LocationArea;

});