define(['knockout', './Criteria', '../InputTypes/Range','conceptpicker/InputTypes/Concept'], function (ko, Criteria, Range, Concept) {

	function DrugEra(data, conceptSets) {
		var self = this;
		data = data || {};

		Criteria.call(this, data, conceptSets);		

		// set up subscription to update CodesetId if the item is removed from conceptSets
		conceptSets.subscribe(function (changes) {
			changes.forEach(function(change) {
					if (change.status === 'deleted') {
					  if (ko.utils.unwrapObservable(self.CodesetId) == change.value.id)
							self.CodesetId(null);
					}
			});
		}, null, "arrayChange");

		// General Drug Era Criteria

		// Verbatim fields
		self.CodesetId = ko.observable(data.CodesetId);

		self.EraStartDate = ko.observable(data.EraStartDate && new Range(data.EraStartDate));
		self.EraEndDate = ko.observable(data.EraEndDate && new Range(data.EraEndDate));
		self.OccurrenceCount = ko.observable(data.OccurrenceCount && new Range(data.OccurrenceCount));
		self.GapDays = ko.observable(data.GapDays && new Range(data.GapDays));
		self.EraLength = ko.observable(data.EraLength && new Range(data.EraLength));

		// Derived Fields
		self.First = ko.observable(data.First || null);
		self.AgeAtStart = ko.observable(data.AgeAtStart && new Range(data.AgeAtStart));
		self.AgeAtEnd = ko.observable(data.AgeAtEnd && new Range(data.AgeAtEnd));

		// Linked Fields
		self.Gender = ko.observable(data.Gender && ko.observableArray(data.Gender.map(function (d) {
			return new Concept(d);
		})));
	}

	DrugEra.prototype = new Criteria();
	DrugEra.prototype.constructor = DrugEra;
	DrugEra.prototype.toJSON = function () {
		return this;
	}
	
	return DrugEra;
});