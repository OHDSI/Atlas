define(['knockout', './Criteria', '../InputTypes/Range','conceptpicker/InputTypes/Concept', '../InputTypes/Text'], function (ko, Criteria, Range, Concept, Text) {

	function Specimen(data, conceptSets) {
		var self = this;
		data = data || {};

		Criteria.call(this, data, conceptSets);
		
		// set up subscription to update CodesetId if the item is removed from conceptSets
		conceptSets.subscribe(function (changes) {
			changes.forEach(function(change) {
					if (change.status === 'deleted') {
					  if (self.CodesetId() == change.value.id)
							self.CodesetId(null);
					}
			});
		}, null, "arrayChange");

		
		// General Observation Criteria

		// Verbatim fields
		self.CodesetId = ko.observable(data.CodesetId);

		self.OccurrenceStartDate = ko.observable(data.OccurrenceStartDate && new Range(data.OccurrenceStartDate));
		self.SpecimenType = ko.observable(data.SpecimenType && ko.observableArray(data.SpecimenType.map(function (d) {
			return new Concept(d);
		})));
		self.SpecimenTypeExclude = ko.observable(data.SpecimenTypeExclude || null);				
		self.Quantity = ko.observable(data.Quantity && new Range(data.Quantity));
		self.Unit = ko.observable(data.Unit && ko.observableArray(data.Unit.map(function (d) {
			return new Concept(d);
		})));
		self.AnatomicSite = ko.observable(data.AnatomicSite && ko.observableArray(data.AnatomicSite.map(function (d) {
			return new Concept(d);
		})));
		self.DiseaseStatus = ko.observable(data.DiseaseStatus && ko.observableArray(data.DiseaseStatus.map(function (d) {
			return new Concept(d);
		})));
		self.SourceId = ko.observable(data.SourceId && new Text(data.SourceId));

		// Derived Fields
		self.First = ko.observable(data.First || null);
		self.Age = ko.observable(data.Age && new Range(data.Age));

		// Linked Fields
		self.Gender = ko.observable(data.Gender && ko.observableArray(data.Gender.map(function (d) {
			return new Concept(d);
		})));
	}

	Specimen.prototype = new Criteria();
	Specimen.prototype.constructor = Specimen;
	Specimen.prototype.toJSON = function () {
		return this;
	}

	return Specimen;

});