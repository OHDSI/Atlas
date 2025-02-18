define(['knockout', './Criteria', '../InputTypes/Range','conceptpicker/InputTypes/Concept', '../InputTypes/Text', '../InputTypes/ConceptSetSelection'
], function (ko, Criteria, Range, Concept, Text, ConceptSetSelection) {

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
		self.ObservationTypeCS = ko.observable(data.ObservationTypeCS && new ConceptSetSelection(data.ObservationTypeCS, conceptSets));
		self.ValueAsNumber = ko.observable(data.ValueAsNumber && new Range(data.ValueAsNumber));
		self.ValueAsString = ko.observable(data.ValueAsString && new Text(data.ValueAsString));
		self.ValueAsConcept = ko.observable(data.ValueAsConcept && ko.observableArray(data.ValueAsConcept.map(function (d) {
			return new Concept(d);
		})));
		self.ValueAsConceptCS = ko.observable(data.ValueAsConceptCS && new ConceptSetSelection(data.ValueAsConceptCS, conceptSets));
		self.Qualifier = ko.observable(data.Qualifier && ko.observableArray(data.Qualifier.map(function (d) {
			return new Concept(d);
		})));
		self.QualifierCS = ko.observable(data.QualifierCS && new ConceptSetSelection(data.QualifierCS, conceptSets));
		self.Unit = ko.observable(data.Unit && ko.observableArray(data.Unit.map(function (d) {
			return new Concept(d);
		})));
		self.UnitCS = ko.observable(data.UnitCS && new ConceptSetSelection(data.UnitCS, conceptSets));
		self.ObservationSourceConcept = ko.observable(data.ObservationSourceConcept != null ? ko.observable(data.ObservationSourceConcept) : null);

		// Derived Fields
		self.First = ko.observable(data.First || null);
		self.Age = ko.observable(data.Age && new Range(data.Age));

		// Linked Fields
		self.Gender = ko.observable(data.Gender && ko.observableArray(data.Gender.map(function (d) {
			return new Concept(d);
		})));
		self.GenderCS = ko.observable(data.GenderCS && new ConceptSetSelection(data.GenderCS, conceptSets));
	 
		self.ProviderSpecialty = ko.observable(data.ProviderSpecialty && ko.observableArray(data.ProviderSpecialty.map(function (d) {
			return new Concept(d);
		})));
		self.ProviderSpecialtyCS = ko.observable(data.ProviderSpecialtyCS && new ConceptSetSelection(data.ProviderSpecialtyCS, conceptSets));

		self.VisitType = ko.observable(data.VisitType && ko.observableArray(data.VisitType.map(function (d) {
			return new Concept(d);
		})));
		self.VisitTypeCS = ko.observable(data.VisitTypeCS && new ConceptSetSelection(data.VisitTypeCS, conceptSets));

	}

	Observation.prototype = new Criteria();
	Observation.prototype.constructor = Observation;
	Observation.prototype.toJSON = function () {
		return this;
	}
	
	return Observation;

});