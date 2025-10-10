define(['knockout', './Criteria', '../InputTypes/Range','conceptpicker/InputTypes/Concept', '../InputTypes/Text', '../InputTypes/ConceptSetSelection'], function (ko, Criteria, Range, Concept, Text, ConceptSetSelection) {

	function DeviceOccurence(data, conceptSets) {
		var self = this;
		data = data || {};

		Criteria.call(this, data, conceptSets);
		
		// set up subscription to update CodesetId and DeviceSourceConcept if the item is removed from conceptSets
		conceptSets.subscribe(function (changes) {
			changes.forEach(function(change) {
					if (change.status === 'deleted') {
					  if (ko.utils.unwrapObservable(self.CodesetId) == change.value.id)
							self.CodesetId(null);
						if (ko.utils.unwrapObservable(self.DeviceSourceConcept()) == change.value.id)
							self.DeviceSourceConcept()(null);
					}
			});
		}, null, "arrayChange");
		
		// General Condition Occurence Criteria

		// Verbatim fields
		self.CodesetId = ko.observable(data.CodesetId);

		self.OccurrenceStartDate = ko.observable(data.OccurrenceStartDate && new Range(data.OccurrenceStartDate));
		self.OccurrenceEndDate = ko.observable(data.OccurrenceEndDate && new Range(data.OccurrenceEndDate));
		self.DeviceType = ko.observable(data.DeviceType && ko.observableArray(data.DeviceType.map(function (d) {
			return new Concept(d);
		})));
		self.DeviceTypeExclude = ko.observable(data.DeviceTypeExclude || null);
		self.DeviceTypeCS = ko.observable(data.DeviceTypeCS && new ConceptSetSelection(data.DeviceTypeCS, conceptSets));
		
		self.UniqueDeviceId = ko.observable(data.UniqueDeviceId && new Text(data.StopReason));
		self.Quantity = ko.observable(data.Quantity && new Range(data.Quantity));
		self.DeviceSourceConcept = ko.observable(data.DeviceSourceConcept != null ? ko.observable(data.DeviceSourceConcept) : null);

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

	DeviceOccurence.prototype = new Criteria();
	DeviceOccurence.prototype.constructor = DeviceOccurence;
	DeviceOccurence.prototype.toJSON = function () {
		return this;
	}

	return DeviceOccurence;

});