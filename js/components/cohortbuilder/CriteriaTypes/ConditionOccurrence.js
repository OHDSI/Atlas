define(['knockout', './Criteria', '../InputTypes/Range','conceptpicker/InputTypes/Concept', '../InputTypes/Text', '../InputTypes/ConceptSetSelection'
], function (ko, Criteria, Range, Concept, Text,ConceptSetSelection) {

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
		self.ConditionTypeExclude = ko.observable(data.ConditionTypeExclude || null);
		self.ConditionTypeCS = ko.observable(data.ConditionTypeCS && new ConceptSetSelection(data.ConditionTypeCS, conceptSets));

		self.StopReason = ko.observable(data.StopReason && new Text(data.StopReason));
		self.ConditionSourceConcept = ko.observable(data.ConditionSourceConcept != null ? ko.observable(data.ConditionSourceConcept) : null);
		self.ConditionStatus = ko.observable(data.ConditionStatus && ko.observableArray(data.ConditionStatus.map(function (d) {
			return new Concept(d);
		})));
		self.ConditionStatusCS = ko.observable(data.GenderCS && new ConceptSetSelection(data.ConditionStatusCS, conceptSets));

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

	ConditionOccurrence.prototype = new Criteria();
	ConditionOccurrence.prototype.constructor = ConditionOccurrence;
	ConditionOccurrence.prototype.toJSON = function () {
		return this;
	}
	
	return ConditionOccurrence;

});