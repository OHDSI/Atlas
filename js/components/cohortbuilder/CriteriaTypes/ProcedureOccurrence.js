define(['knockout', './Criteria', '../InputTypes/Range','conceptpicker/InputTypes/Concept'], function (ko, Criteria, Range, Concept) {

	function ProcedureOccurrence(data, conceptSets) {
		var self = this;
		data = data || {};

		Criteria.call(this, data, conceptSets);
		
		// set up subscription to update CodesetId and ProcedureSourceConcept if the item is removed from conceptSets
		conceptSets.subscribe(function (changes) {
			changes.forEach(function(change) {
					if (change.status === 'deleted') {
					  if (ko.utils.unwrapObservable(self.CodesetId) == change.value.id)
							self.CodesetId(null);
						if (ko.utils.unwrapObservable(self.ProcedureSourceConcept()) == change.value.id)
							self.ProcedureSourceConcept()(null);
					}
			});
		}, null, "arrayChange");
		
		// General Condition Occurence Criteria

		// Verbatim fields
		self.CodesetId = ko.observable(data.CodesetId);

		self.OccurrenceStartDate = ko.observable(data.OccurrenceStartDate && new Range(data.OccurrenceStartDate));
		self.ProcedureType = ko.observable(data.ProcedureType && ko.observableArray(data.ProcedureType.map(function (d) {
			return new Concept(d);
		})));
		self.ProcedureTypeExclude = ko.observable(data.ProcedureTypeExclude || null);				
		
		self.Modifier = ko.observable(data.Modifier && ko.observableArray(data.Modifier.map(function (d) {
			return new Concept(d);
		})));
		
		self.Quantity = ko.observable(data.Quantity && new Range(data.Quantity));
		
		self.ProcedureSourceConcept = ko.observable(data.ProcedureSourceConcept != null ? ko.observable(data.ProcedureSourceConcept) : null);

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

	ProcedureOccurrence.prototype = new Criteria();
	ProcedureOccurrence.prototype.constructor = ProcedureOccurrence;
	ProcedureOccurrence.prototype.toJSON = function () {
		return this;
	}
	
	return ProcedureOccurrence;

});