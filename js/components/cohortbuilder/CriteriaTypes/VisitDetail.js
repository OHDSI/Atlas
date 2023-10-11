define(['knockout', './Criteria', '../InputTypes/Range', '../InputTypes/ConceptSetSelection','conceptpicker/InputTypes/Concept', '../InputTypes/Text'], function (ko, Criteria, Range, ConceptSetSelection, Concept, Text) {

	function VisitDetail(data, conceptSets) {
		var self = this;
		data = data || {};

		Criteria.call(this, data, conceptSets);
		// set up subscription to update CodesetId and VisitSourceConcept if the item is removed from conceptSets
		conceptSets.subscribe(function (changes) {
			changes.forEach(function(change) {
					if (change.status === 'deleted') {
						if (ko.utils.unwrapObservable(self.CodesetId) == change.value.id) {
							self.CodesetId(null);
						}
						if (ko.utils.unwrapObservable(self.VisitDetailSourceConcept()) == change.value.id) {
							self.VisitSourceConcept()(null);
						}
						if (ko.utils.unwrapObservable(self.VisitDetailTypeCS() && self.VisitDetailTypeCS().CodesetId) == change.value.id) {
							self.VisitDetailTypeCS(new ConceptSetSelection());
						}
						if (ko.utils.unwrapObservable(self.GenderCS() && self.GenderCS().CodesetId) == change.value.id) {
							self.GenderCS(new ConceptSetSelection());
						}
						if (ko.utils.unwrapObservable(self.ProviderSpecialtyCS() && self.ProviderSpecialtyCS().CodesetId) == change.value.id) {
							self.ProviderSpecialtyCS(new ConceptSetSelection());
						}
						if (ko.utils.unwrapObservable(self.PlaceOfServiceCS() && self.PlaceOfServiceCS().CodesetId) == change.value.id) {
							self.PlaceOfServiceCS(new ConceptSetSelection());
						}

					}
			});
		}, null, "arrayChange");

		// General Condition Occurence Criteria

		// Verbatim fields
		self.CodesetId = ko.observable(data.CodesetId);

		self.VisitDetailStartDate = ko.observable(data.VisitDetailStartDate && new Range(data.VisitDetailStartDate));
		self.VisitDetailEndDate = ko.observable(data.VisitDetailEndDate && new Range(data.VisitDetailEndDate));
		self.VisitDetailTypeCS = ko.observable(data.VisitDetailTypeCS && new ConceptSetSelection(data.VisitDetailTypeCS));
		self.VisitDetailTypeExclude = ko.observable(data.VisitDetailTypeExclude || null);
		self.VisitDetailSourceConcept = ko.observable(data.VisitDetailSourceConcept != null ? ko.observable(data.VisitDetailSourceConcept) : null);
		self.VisitDetailLength = ko.observable(data.VisitDetailLength && new Range(data.VisitDetailLength));

		// Derived Fields
		self.First = ko.observable(data.First || null);
		self.Age = ko.observable(data.Age && new Range(data.Age));

		// Linked Fields
		self.GenderCS = ko.observable(data.GenderCS && new ConceptSetSelection(data.GenderCS));

	  /* Do we still need prior enroll days inside the individual criteria?
		self.PriorEnrollDays = ko.observable((typeof data.PriorEnrollDays == "number") ? data.PriorEnrollDays : null);
		self.AfterEnrollDays = ko.observable((typeof data.AfterEnrollDays == "number") ? data.AfterEnrollDays : null);
		*/
		self.ProviderSpecialtyCS = ko.observable(data.ProviderSpecialtyCS && new ConceptSetSelection(data.ProviderSpecialtyCS));

		self.PlaceOfServiceCS = ko.observable(data.PlaceOfServiceCS && new ConceptSetSelection(data.PlaceOfServiceCS));

		self.PlaceOfServiceLocation = ko.observable(data.PlaceOfServiceLocation != null ? ko.observable(data.PlaceOfServiceLocation) : null);
		self.PlaceOfServiceDistance = ko.observable(data.PlaceOfServiceDistance && new Range(data.PlaceOfServiceDistance));
	}

	VisitDetail.prototype = new Criteria();
	VisitDetail.prototype.constructor = VisitDetail;
	VisitDetail.prototype.toJSON = function () {
		return this;
	};
	
	return VisitDetail;

});