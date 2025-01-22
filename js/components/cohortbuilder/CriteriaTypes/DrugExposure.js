define(['knockout', './Criteria', '../InputTypes/Range','conceptpicker/InputTypes/Concept', '../InputTypes/Text','../InputTypes/ConceptSetSelection'
], function (ko, Criteria, Range, Concept, Text, ConceptSetSelection) {

	function DrugExposure(data, conceptSets) {
		var self = this;
		data = data || {};

		Criteria.call(this, data, conceptSets);
		
		// set up subscription to update CodesetId and DrugSourceConcept if the item is removed from conceptSets
		conceptSets.subscribe(function (changes) {
			changes.forEach(function(change) {
					if (change.status === 'deleted') {
					  if (ko.utils.unwrapObservable(self.CodesetId) == change.value.id)
							self.CodesetId(null);
						if (ko.utils.unwrapObservable(self.DrugSourceConcept()) == change.value.id)
							self.DrugSourceConcept(null);
					}
			});
		}, null, "arrayChange");

		// General Drug Exposure Criteria

		// Verbatim fields
		self.CodesetId = ko.observable(data.CodesetId);

		self.OccurrenceStartDate = ko.observable(data.OccurrenceStartDate && new Range(data.OccurrenceStartDate));
		self.OccurrenceEndDate = ko.observable(data.OccurrenceEndDate && new Range(data.OccurrenceEndDate));
		self.DrugType = ko.observable(data.DrugType && ko.observableArray(data.DrugType.map(function (d) {
			return new Concept(d);
		})));
		self.DrugTypeExclude = ko.observable(data.DrugTypeExclude || null);		
		self.DrugTypeCS = ko.observable(data.DrugTypeCS && new ConceptSetSelection(data.DrugTypeCS, conceptSets));
		self.StopReason = ko.observable(data.StopReason && new Text(data.StopReason));
		self.Refills = ko.observable(data.Refills && new Range(data.Refills));
		self.Quantity = ko.observable(data.Quantity && new Range(data.Quantity));
		self.DaysSupply = ko.observable(data.DaysSupply && new Range(data.DaysSupply));
		self.RouteConcept = ko.observable(data.RouteConcept && ko.observableArray(data.RouteConcept.map(function (d) {
			return new Concept(d);
		})));
		self.RouteConceptCS = ko.observable(data.RouteConceptCS && new ConceptSetSelection(data.RouteConceptCS, conceptSets));
		self.EffectiveDrugDose = ko.observable(data.EffectiveDrugDose && new Range(data.EffectiveDrugDose));
		self.DoseUnit = ko.observable(data.DoseUnit && ko.observableArray(data.DoseUnit.map(function (d) {
			return new Concept(d);
		})));
		self.DoseUnitCS = ko.observable(data.DoseUnitCS && new ConceptSetSelection(data.DoseUnitCS, conceptSets));
		self.LotNumber = ko.observable(data.LotNumber && new Text(data.LotNumber));
		self.DrugSourceConcept = ko.observable(data.DrugSourceConcept != null ? ko.observable(data.DrugSourceConcept) : null);

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
		self.ProviderSpecialtyCS = ko.observable(data.GenderCS && new ConceptSetSelection(data.ProviderSpecialtyCS, conceptSets));

		self.VisitType = ko.observable(data.VisitType && ko.observableArray(data.VisitType.map(function (d) {
			return new Concept(d);
		})));
		self.VisitTypeCS = ko.observable(data.GenderCS && new ConceptSetSelection(data.VisitTypeCS, conceptSets));

	}

	DrugExposure.prototype = new Criteria();
	DrugExposure.prototype.constructor = DrugExposure;
	DrugExposure.prototype.toJSON = function () {
		return this;
	}

	return DrugExposure;

});