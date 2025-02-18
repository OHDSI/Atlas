define(['knockout', './Criteria', '../InputTypes/Range','conceptpicker/InputTypes/Concept', '../InputTypes/ConceptSetSelection'
], function (ko, Criteria, Range, Concept, ConceptSetSelection) {

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
		self.ProcedureTypeCS = ko.observable(data.ProcedureTypeCS && new ConceptSetSelection(data.ProcedureTypeCS, conceptSets));

		self.Modifier = ko.observable(data.Modifier && ko.observableArray(data.Modifier.map(function (d) {
			return new Concept(d);
		})));
		self.ModifierCS = ko.observable(data.ModifierCS && new ConceptSetSelection(data.ModifierCS, conceptSets));
		
		self.Quantity = ko.observable(data.Quantity && new Range(data.Quantity));
		
		self.ProcedureSourceConcept = ko.observable(data.ProcedureSourceConcept != null ? ko.observable(data.ProcedureSourceConcept) : null);

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

	ProcedureOccurrence.prototype = new Criteria();
	ProcedureOccurrence.prototype.constructor = ProcedureOccurrence;
	ProcedureOccurrence.prototype.toJSON = function () {
		return this;
	}
	
	return ProcedureOccurrence;

});