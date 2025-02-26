define(['knockout', '../InputTypes/Range', 'conceptpicker/InputTypes/Concept', '../InputTypes/ConceptSetSelection'], function (ko, Range, Concept, ConceptSetSelection) {

	function DemographicCriteria(data, conceptSets) {
		var self = this;
		data = data || {};

		self.Age = ko.observable(data.Age && new Range(data.Age));

		self.Gender = ko.observable(data.Gender && ko.observableArray(data.Gender.map(function (d) {
			return new Concept(d);
		})));
		self.GenderCS = ko.observable(data.GenderCS && new ConceptSetSelection(data.GenderCS, conceptSets));

		self.Race = ko.observable(data.Race && ko.observableArray(data.Race.map(function (d) {
			return new Concept(d);
		})));
		self.RaceCS = ko.observable(data.RaceCS && new ConceptSetSelection(data.RaceCS, conceptSets));

		self.Ethnicity = ko.observable(data.Ethnicity && ko.observableArray(data.Ethnicity.map(function (d) {
			return new Concept(d);
		})));
		self.EthnicityCS = ko.observable(data.EthnicityCS && new ConceptSetSelection(data.EthnicityCS, conceptSets));

		
		self.OccurrenceStartDate = ko.observable(data.OccurrenceStartDate && new Range(data.OccurrenceStartDate));
		self.OccurrenceEndDate = ko.observable(data.OccurrenceEndDate && new Range(data.OccurrenceEndDate));

	}

	DemographicCriteria.prototype.toJSON = function () {
		return this;
	}
	
	return DemographicCriteria;
});