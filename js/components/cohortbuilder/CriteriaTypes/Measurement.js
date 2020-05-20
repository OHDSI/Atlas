define(['knockout', './Criteria', '../InputTypes/Range','conceptpicker/InputTypes/Concept', '../InputTypes/Text'], function (ko, Criteria, Range, Concept, Text) {

	function Measurement(data, conceptSets) {
		var self = this;
		data = data || {};

		Criteria.call(this, data, conceptSets);
		
		// set up subscription to update CodesetId and MeasurementSourceConcept if the item is removed from conceptSets
		conceptSets.subscribe(function (changes) {
			changes.forEach(function(change) {
					if (change.status === 'deleted') {
					  if (ko.utils.unwrapObservable(self.CodesetId) == change.value.id)
							self.CodesetId(null);
						if (ko.utils.unwrapObservable(self.MeasurementSourceConcept()) == change.value.id)
							self.MeasurementSourceConcept()(null);
					}
			});
		}, null, "arrayChange");

		// General Condition Occurence Criteria

		// Verbatim fields
		self.CodesetId = ko.observable(data.CodesetId);
		self.First = ko.observable(data.First || null);
		self.OccurrenceStartDate = ko.observable(data.OccurrenceStartDate && new Range(data.OccurrenceStartDate));
		self.MeasurementType = ko.observable(data.MeasurementType && ko.observableArray(data.MeasurementType.map(function (d) {
			return new Concept(d);
		})));
		self.MeasurementTypeExclude = ko.observable(data.MeasurementTypeExclude || null);				
		self.Operator = ko.observable(data.Operator && ko.observableArray(data.Operator.map(function (d) {
			return new Concept(d);
		})));
		self.ValueAsNumber = ko.observable(data.ValueAsNumber && new Range(data.ValueAsNumber));
		self.ValueAsConcept = ko.observable(data.ValueAsConcept && ko.observableArray(data.ValueAsConcept.map(function (d) {
			return new Concept(d);
		}))); 
		self.Unit = ko.observable(data.Unit && ko.observableArray(data.Unit.map(function (d) {
			return new Concept(d);
		}))); 
		self.RangeLow = ko.observable(data.RangeLow && new Range(data.RangeLow));
		self.RangeHigh = ko.observable(data.RangeHigh && new Range(data.RangeHigh));
		self.MeasurementSourceConcept = ko.observable(data.MeasurementSourceConcept != null ? ko.observable(data.MeasurementSourceConcept) : null);
		
		// Derived Fields
		self.RangeLowRatio = ko.observable(data.RangeLowRatio && new Range(data.RangeLowRatio));
		self.RangeHighRatio = ko.observable(data.RangeHighRatio && new Range(data.RangeHighRatio));
		self.Abnormal = ko.observable(data.Abnormal || null);
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

	Measurement.prototype = new Criteria();
	Measurement.prototype.constructor = Measurement;
	Measurement.prototype.toJSON = function () {
		return this;
	}
	
	return Measurement;

});