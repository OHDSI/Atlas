define(['knockout', './Criteria', '../InputTypes/Range','conceptpicker/InputTypes/Concept', '../InputTypes/Text'], function (ko, Criteria, Range, Concept, Text) {

	function VisitOccurence(data, conceptSets) {
		var self = this;
		data = data || {};

		Criteria.call(this, data, conceptSets);
		
		// set up subscription to update CodesetId and VisitSourceConcept if the item is removed from conceptSets
		conceptSets.subscribe(function (changes) {
			changes.forEach(function(change) {
					if (change.status === 'deleted') {
						if (ko.utils.unwrapObservable(self.CodesetId) == change.value.id)
							self.CodesetId(null);
						if (ko.utils.unwrapObservable(self.VisitSourceConcept()) == change.value.id)
							self.VisitSourceConcept()(null);
					}
			});
		}, null, "arrayChange");

		// General Condition Occurence Criteria

		// Verbatim fields
		self.CodesetId = ko.observable(data.CodesetId);

		self.OccurrenceStartDate = ko.observable(data.OccurrenceStartDate && new Range(data.OccurrenceStartDate));
		self.OccurrenceEndDate = ko.observable(data.OccurrenceEndDate && new Range(data.OccurrenceEndDate));
		self.VisitType = ko.observable(data.VisitType && ko.observableArray(data.VisitType.map(function (d) {
			return new Concept(d);
		})));
		self.VisitTypeExclude = ko.observable(data.VisitTypeExclude || null);				
		self.VisitSourceConcept = ko.observable(data.VisitSourceConcept != null ? ko.observable(data.VisitSourceConcept) : null);
		self.VisitLength = ko.observable(data.VisitLength && new Range(data.VisitLength));

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

		self.PlaceOfService = ko.observable(data.PlaceOfService && ko.observableArray(data.PlaceOfService.map(function (d) {
			return new Concept(d);
		})));

		self.PlaceOfServiceLocation = ko.observable(data.PlaceOfServiceLocation != null ? ko.observable(data.PlaceOfServiceLocation) : null);
		self.PlaceOfServiceDistance = ko.observable(data.PlaceOfServiceDistance && new Range(data.PlaceOfServiceDistance));
	}

	VisitOccurence.prototype = new Criteria();
	VisitOccurence.prototype.constructor = VisitOccurence;
	VisitOccurence.prototype.toJSON = function () {
		return this;
	}
	
	return VisitOccurence;

});