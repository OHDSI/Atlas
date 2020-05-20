define(['knockout', './Criteria', '../InputTypes/Range','conceptpicker/InputTypes/Concept', '../InputTypes/Text'], function (ko, Criteria, Range, Concept, Text) {

	function Observation(data, conceptSets) {
		var self = this;
		data = data || {};

		Criteria.call(this, data, conceptSets);
		
		// set up subscription to update CodesetId and ObservationSourceConcept if the item is removed from conceptSets
		conceptSets.subscribe(function (changes) {
			changes.forEach(function(change) {
					if (change.status === 'deleted') {
					  if (ko.utils.unwrapObservable(self.CodesetId) == change.value.id)
							self.CodesetId(null);
						if (ko.utils.unwrapObservable(self.ObservationSourceConcept()) == change.value.id)
							self.ObservationSourceConcept()(null);
					}
			});
		}, null, "arrayChange");
		
		// General Observation Criteria

		// Verbatim fields
		self.CodesetId = ko.observable(data.CodesetId);

		self.OccurrenceStartDate = ko.observable(data.OccurrenceStartDate && new Range(data.OccurrenceStartDate));
		self.ObservationType = ko.observable(data.ObservationType && ko.observableArray(data.ObservationType.map(function (d) {
			return new Concept(d);
		})));
		self.ObservationTypeExclude = ko.observable(data.ObservationTypeExclude || null);				
		self.ValueAsNumber = ko.observable(data.ValueAsNumber && new Range(data.ValueAsNumber));
		self.ValueAsString = ko.observable(data.ValueAsString && new Text(data.ValueAsString));
		self.ValueAsConcept = ko.observable(data.ValueAsConcept && ko.observableArray(data.ValueAsConcept.map(function (d) {
			return new Concept(d);
		})));
		self.Qualifier = ko.observable(data.Qualifier && ko.observableArray(data.Qualifier.map(function (d) {
			return new Concept(d);
		})));
		self.Unit = ko.observable(data.Unit && ko.observableArray(data.Unit.map(function (d) {
			return new Concept(d);
		})));
		self.ObservationSourceConcept = ko.observable(data.ObservationSourceConcept != null ? ko.observable(data.ObservationSourceConcept) : null);

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

	Observation.prototype = new Criteria();
	Observation.prototype.constructor = Observation;
	Observation.prototype.toJSON = function () {
		return this;
	}
	
	return Observation;

});