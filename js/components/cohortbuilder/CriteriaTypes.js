define(function (require, exports) {

	var ConditionOccurrence = require("./CriteriaTypes/ConditionOccurrence");
	var ConditionEra = require("./CriteriaTypes/ConditionEra");
	var DrugExposure = require("./CriteriaTypes/DrugExposure");
	var DrugEra = require("./CriteriaTypes/DrugEra");
	var DoseEra = require("./CriteriaTypes/DoseEra");
	var Observation = require("./CriteriaTypes/Observation");
	var ProcedureOccurrence = require("./CriteriaTypes/ProcedureOccurrence");
	var Specimen = require("./CriteriaTypes/Specimen");
	var VisitOccurrence = require("./CriteriaTypes/VisitOccurrence");
	var VisitDetail = require("./CriteriaTypes/VisitDetail");
	var DeviceExposure = require("./CriteriaTypes/DeviceExposure");
	var Measurement = require("./CriteriaTypes/Measurement");
	var ObservationPeriod = require("./CriteriaTypes/ObservationPeriod");	
	var Death = require("./CriteriaTypes/Death");
	var DemographicCriteria = require("./CriteriaTypes/DemographicCriteria");
	var PayerPlanPeriod = require("./CriteriaTypes/PayerPlanPeriod");
	var LocationRegion = require("./CriteriaTypes/LocationRegion");
	
	function GetCriteriaFromObject (data, conceptSets)
	{
		var result;
		
		if (data.hasOwnProperty("ConditionOccurrence")) {
			return {
				ConditionOccurrence: new exports.ConditionOccurrence(data.ConditionOccurrence, conceptSets)
			};
		} else if (data.hasOwnProperty("ConditionEra")) {
			return {
				ConditionEra: new exports.ConditionEra(data.ConditionEra, conceptSets)
			};
		} else if (data.hasOwnProperty("DrugExposure")) {
			return {
				DrugExposure: new exports.DrugExposure(data.DrugExposure, conceptSets)
			};
		} else if (data.hasOwnProperty("DrugEra")) {
			return {
				DrugEra: new exports.DrugEra(data.DrugEra, conceptSets)
			};
		} else if (data.hasOwnProperty("DoseEra")) {
			return {
				DoseEra: new exports.DoseEra(data.DoseEra, conceptSets)
			};
		} else if (data.hasOwnProperty("Observation")) {
			return {
				Observation: new exports.Observation(data.Observation, conceptSets)
			};
		} else if (data.hasOwnProperty("Person")) {
			return {
				Person: new exports.Person(data.Person)
			};
		} else if (data.hasOwnProperty("ProcedureOccurrence")) {
			return {
				ProcedureOccurrence: new exports.ProcedureOccurrence(data.ProcedureOccurrence, conceptSets)
			};
		} else if (data.hasOwnProperty("VisitOccurrence")) {
			return {
				VisitOccurrence: new exports.VisitOccurrence(data.VisitOccurrence, conceptSets)
			};
		} else if (data.hasOwnProperty("VisitDetail")) {
			return {
				VisitDetail: new exports.VisitDetail(data.VisitDetail, conceptSets)
			};
		} else if (data.hasOwnProperty("DeviceExposure")) {
			return {
				DeviceExposure: new exports.DeviceExposure(data.DeviceExposure, conceptSets)
			};		
		} else if (data.hasOwnProperty("Measurement")) {
			return {
				Measurement: new exports.Measurement(data.Measurement, conceptSets)
			};		
		} else if (data.hasOwnProperty("ObservationPeriod")) {
			return {
				ObservationPeriod: new exports.ObservationPeriod(data.ObservationPeriod, conceptSets)
			};		
		} else if (data.hasOwnProperty("Specimen")) {
			return {
				Specimen: new exports.Specimen(data.Specimen, conceptSets)
			};		
		}	else if (data.hasOwnProperty("Death")) {
			return {
				Death: new exports.Death(data.Death, conceptSets)
			};
		}	else if (data.hasOwnProperty("PayerPlanPeriod")) {
			return {
				PayerPlanPeriod: new exports.PayerPlanPeriod(data.PayerPlanPeriod, conceptSets)
			};
		}	else if (data.hasOwnProperty("LocationRegion")) {
			return {
				LocationRegion: new exports.LocationRegion(data.LocationRegion, conceptSets)
			};
		};
	}
	
	exports.ConditionOccurrence = ConditionOccurrence;
	exports.ConditionEra = ConditionEra;
	exports.DrugExposure = DrugExposure;
	exports.DrugEra = DrugEra;
	exports.DoseEra = DoseEra;
	exports.Observation = Observation;
	exports.Specimen = Specimen;	
	exports.ProcedureOccurrence = ProcedureOccurrence;
	exports.VisitOccurrence = VisitOccurrence;
	exports.VisitDetail = VisitDetail;
	exports.DeviceExposure = DeviceExposure;
	exports.Measurement = Measurement;
	exports.ObservationPeriod = ObservationPeriod;
	exports.Death = Death;
	exports.DemographicCriteria = DemographicCriteria;
	exports.PayerPlanPeriod = PayerPlanPeriod;
	exports.LocationRegion = LocationRegion;
	
	exports.GetCriteriaFromObject = GetCriteriaFromObject;

});
