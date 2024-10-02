define([
  "knockout",
  "../CriteriaTypes/Measurement",
  "../CriteriaTypes",
  "../InputTypes/Range",
], function (
  ko,
  Measurement,
  CriteriaTypes,
  Range,
){
  function Calculation(data, conceptSets) {
    var self = this;
    data = data || {};

    // var measurement = new Measurement((data.Measurement && data.Measurement.Measurement) ? data.Measurement.Measurement : {}, conceptSets);
    // self.Measurement = ko.observable({Measurement: measurement});
    self.Measurement = ko.observable({ Measurement: new CriteriaTypes.Measurement((data.Measurement && data.Measurement.Measurement) ? data.Measurement.Measurement : {}, conceptSets) });
    self.Operator = ko.observable(data.Operator || "-");
    self.Limit = ko.observable(data.Limit || "First");
    self.SameVisit = ko.observable(!!data.SameVisit);
    self.ValueAsNumber = ko.observable(new Range(data.ValueAsNumber));
  }

  return Calculation;
});