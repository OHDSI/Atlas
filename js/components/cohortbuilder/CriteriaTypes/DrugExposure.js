define(['knockout', './Criteria', '../InputTypes/Range','conceptpicker/InputTypes/Concept', '../InputTypes/Text'], function (ko, Criteria, Range, Concept, Text) {

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
		self.StopReason = ko.observable(data.StopReason && new Text(data.StopReason));
		self.Refills = ko.observable(data.Refills && new Range(data.Refills));
		self.Quantity = ko.observable(data.Quantity && new Range(data.Quantity));
		self.DaysSupply = ko.observable(data.DaysSupply && new Range(data.DaysSupply));
		self.RouteConcept = ko.observable(data.RouteConcept && ko.observableArray(data.RouteConcept.map(function (d) {
			return new Concept(d);
		})));
		self.EffectiveDrugDose = ko.observable(data.EffectiveDrugDose && new Range(data.EffectiveDrugDose));
		self.DoseUnit = ko.observable(data.DoseUnit && ko.observableArray(data.DoseUnit.map(function (d) {
			return new Concept(d);
		})));
		self.LotNumber = ko.observable(data.LotNumber && new Text(data.LotNumber));
		self.DrugSourceConcept = ko.observable(data.DrugSourceConcept != null ? ko.observable(data.DrugSourceConcept) : null);

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

	DrugExposure.prototype = new Criteria();
	DrugExposure.prototype.constructor = DrugExposure;
	DrugExposure.prototype.toJSON = function () {
		return this;
	}

	return DrugExposure;

});