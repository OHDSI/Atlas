define(['knockout', './Criteria', '../InputTypes/Range','conceptpicker/InputTypes/Concept', '../InputTypes/Text'], function (ko, Criteria, Range, Concept, Text) {

	function Death(data, conceptSets) {
		var self = this;
		data = data || {};

		Criteria.call(this, data, conceptSets);
		
		// set up subscription to update CodesetId and DeathSourceConcept if the item is removed from conceptSets
		conceptSets.subscribe(function (changes) {
			changes.forEach(function(change) {
					if (change.status === 'deleted') {
					  if (ko.utils.unwrapObservable(self.CodesetId) == change.value.id)
							self.CodesetId(null);
						if (ko.utils.unwrapObservable(self.DeathSourceConcept()) == change.value.id)
							self.DeathSourceConcept()(null);
					}
			});
		}, null, "arrayChange");
		
		// General Condition Occurence Criteria

		// Verbatim fields
		self.CodesetId = ko.observable(data.CodesetId);

		self.OccurrenceStartDate = ko.observable(data.OccurrenceStartDate && new Range(data.OccurrenceStartDate));
		self.DeathType = ko.observable(data.DeathType && ko.observableArray(data.DeathType.map(function (d) {
			return new Concept(d);
		})));
		self.DeathTypeExclude = ko.observable(data.DeathTypeExclude || null);
		self.DeathSourceConcept = ko.observable(data.DeathSourceConcept != null ? ko.observable(data.DeathSourceConcept) : null);
		// Derived Fields
		self.Age = ko.observable(data.Age && new Range(data.Age));

		// Linked Fields
		self.Gender = ko.observable(data.Gender && ko.observableArray(data.Gender.map(function (d) {
			return new Concept(d);
		})));

	  /* Do we still need prior enroll days inside the individual criteria?
		self.PriorEnrollDays = ko.observable((typeof data.PriorEnrollDays == "number") ? data.PriorEnrollDays : null);
		self.AfterEnrollDays = ko.observable((typeof data.AfterEnrollDays == "number") ? data.AfterEnrollDays : null);
		*/
	}

	Death.prototype = new Criteria();
	Death.prototype.constructor = Death;
	Death.prototype.toJSON = function () {
		return this;
	}
	
	return Death;

});