define(['knockout', './Criteria', '../InputTypes/Range','conceptpicker/InputTypes/Concept', '../InputTypes/Text'], function (ko, Criteria, Range, Concept, Text) {

	function ConditionOccurrence(data, conceptSets) {
		var self = this;
		data = data || {};

		Criteria.call(this, data, conceptSets);
				
		// set up subscription to update CodesetId and ConditionSourceConcept if the item is removed from conceptSets
		conceptSets.subscribe(function (changes) {
			changes.forEach(function(change) {
					if (change.status === 'deleted') {
					  if (self.CodesetId() == change.value.id)
							self.CodesetId(null);
						if (ko.utils.unwrapObservable(self.ConditionSourceConcept()) == change.value.id) // ConditionSourceConcept is an observable wrapping another observable.
							self.ConditionSourceConcept()(null);
					}
			});
		}, null, "arrayChange");
		
		// General Condition Occurence Criteria

		// Verbatim fields
		self.CodesetId = ko.observable(data.CodesetId);

		self.OccurrenceStartDate = ko.observable(data.OccurrenceStartDate && new Range(data.OccurrenceStartDate));
		self.OccurrenceEndDate = ko.observable(data.OccurrenceEndDate && new Range(data.OccurrenceEndDate));
		self.ConditionType = ko.observable(data.ConditionType && ko.observableArray(data.ConditionType.map(function (d) {
			return new Concept(d);
		})));
		self.StopReason = ko.observable(data.StopReason && new Text(data.StopReason));
		self.ConditionSourceConcept = ko.observable(data.ConditionSourceConcept != null ? ko.observable(data.ConditionSourceConcept) : null);

		// Derived Fields
		self.First = ko.observable(data.First || null);
		self.Age = ko.observable(data.Age && new Range(data.Age));

		// Linked Fields
		self.Gender = ko.observable(data.Gender && ko.observableArray(data.Gender.map(function (d) {
			return new Concept(d);
		})));

	  /* Do we still need prior enroll days inside the individual criteria?
		self.PriorEnrollDays = ko.observable((typeof data.PriorEnrollDays == "number") ? data.PriorEnrollDays : null);
		self.AfterEnrollDays = ko.observable((typeof data.AfterEnrollDays == "number") ? data.AfterEnrollDays : null);
		*/
	 
		self.ProviderSpecialty = ko.observable(data.ProviderSpecialty && ko.observableArray(data.ProviderSpecialty.map(function (d) {
			return new Concept(d);
		})));
		self.VisitType = ko.observable(data.VisitType && ko.observableArray(data.VisitType.map(function (d) {
			return new Concept(d);
		})));

	}

	ConditionOccurrence.prototype = new Criteria();
	ConditionOccurrence.prototype.constructor = ConditionOccurrence;
	ConditionOccurrence.prototype.toJSON = function () {
		return this;
	}
	
	
	

	return ConditionOccurrence;

});