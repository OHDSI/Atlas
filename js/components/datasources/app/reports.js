define(function (require) {

	var reportConditionOccurrence = require("./reports/condition_occurrence");
	var reportConditionEra = require("./reports/condition_era");
	var reportDrugExposure = require("./reports/drug_exposure");
	var reportProcedureOccurrence = require("./reports/procedure_occurrence");
	var reportDataDensity = require("./reports/data_density");
	var reportObservation = require("./reports/observation");
	var reportDrugEra = require("./reports/drug_era");
	var reportVisitOccurrence = require("./reports/visit_occurrence");
	var reportDeath = require("./reports/death");
	var reportAchillesHeel = require("./reports/achilles_heel");
	var reportMeasurement = require("./reports/measurement");

	var module = {
		ConditionOccurrence: reportConditionOccurrence,
		ConditionEra: reportConditionEra,
		DrugExposure: reportDrugExposure,
		ProcedureOccurrence: reportProcedureOccurrence,
		DataDensity: reportDataDensity,
		Observation: reportObservation,
		DrugEra: reportDrugEra,
		VisitOccurrence: reportVisitOccurrence,
		Death: reportDeath,
		AchillesHeel: reportAchillesHeel,
		Measurement: reportMeasurement
	};

	return module;
});
