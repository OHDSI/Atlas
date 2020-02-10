define([
],
function (

) {

	const CriteriaTypes = {
		DEMOGRAPHIC: "Demographic",
		CONDITION_ERA: "ConditionEra",
		CONDITION_OCCURRENCE: "ConditionOccurrence",
		DEATH: "Death",
		DEVICE_EXPOSURE: "DeviceExposure",
		DOSE_ERA: "DoseEra",
		DRUG_ERA: "DrugEra",
		DRUG_EXPOSURE: "DrugExposure",
		LOCATION_REGION: "LocationRegion",
		MEASUREMENT: "Measurement",
		OBSERVATION: "Observation",
		OBSERVATION_PERIOD: "ObservationPeriod",
		PAYER_PLAN_PERIOD: "PayerPlanPeriod",
		PROCEDURE_OCCURRENCE: "ProcedureOccurrence",
		SPECIMEN: "Specimen",
		VISIT: "VisitOccurrence",
		GROUP: "Group",
	};

	const AddDemographic = {
		text: "Add Demographic",
		selected: false,
		description: "Filter events based on demographic criteria.",
		type: CriteriaTypes.DEMOGRAPHIC,
	};
	const AddConditionEra = {
		text: "Add Condition Era",
		selected: false,
		description: "Find patients with specific condition era.",
		type: CriteriaTypes.CONDITION_ERA,
	};
	const AddConditionOccurrence = {
		text: "Add Condition Occurrence",
		selected: false,
		description: "Find patients with specific conditions.",
		type: CriteriaTypes.CONDITION_OCCURRENCE,
	};
	const AddDeath = {
		text: "Add Death",
		selected: false,
		description: "Find patients based on death.",
		type: CriteriaTypes.DEATH,
	};
	const AddDeviceExposure = {
		text: "Add Device Exposure",
		selected: false,
		description: "Find patients based on device exposure.",
		type: CriteriaTypes.DEVICE_EXPOSURE,
	};
	const AddDoseEra = {
		text: "Add Dose Era",
		selected: false,
		description: "Find patients with dose eras.",
		type: CriteriaTypes.DOSE_ERA,
	};
	const AddDrugEra = {
		text: "Add Drug Era",
		selected: false,
		description: "Find patients with drug eras.",
		type: CriteriaTypes.DRUG_ERA,
	};
	const AddDrugExposure = {
		text: "Add Drug Exposure",
		selected: false,
		description: "Find patients with exposure to specific drugs or drug classes.",
		type: CriteriaTypes.DRUG_EXPOSURE,
	};

	const AddLocationRegion = {
		text: "Add Location Region",
		selected: false,
		description: "Find patients within geographical area.",
		type: CriteriaTypes.LOCATION_REGION,
	};

	const AddMeasurement = {
		text: "Add Measurement",
		selected: false,
		description: "Find patients based on measurements.",
		type: CriteriaTypes.MEASUREMENT,
	};
	const AddObservation = {
		text: "Add Observation",
		selected: false,
		description: "Find patients based on observations.",
		type: CriteriaTypes.OBSERVATION,
	};
	const AddObservationPeriod = {
		text: "Add Observation Period",
		selected: false,
		description: "Find patients based on observation periods.",
		type: CriteriaTypes.OBSERVATION_PERIOD,
	};
	const AddPayerPlanPeriod = {
		text: "Add Payer Plan Period",
		selected: false,
		description: "Find patients based on Payer Plan Period.",
		type: CriteriaTypes.PAYER_PLAN_PERIOD,
	};
	const AddProcedureOccurrence = {
		text: "Add Procedure Occurrence",
		selected: false,
		description: "Find patients that experienced a specific procedure.",
		type: CriteriaTypes.PROCEDURE_OCCURRENCE,
	};
	const AddSpecimen = {
		text: "Add Specimen",
		selected: false,
		description: "Find patients based on specimen.",
		type: CriteriaTypes.SPECIMEN,
	};
	const AddVisit = {
		text: "Add Visit",
		selected: false,
		description: "Find patients based on visit information.",
		type: CriteriaTypes.VISIT,
	};
	const AddGroup = {
		text: "Add Group",
		selected: false,
		description: "Add a group to combine criteria using and/or relationships.",
		type: CriteriaTypes.GROUP,
	};

	const AddCriteriaActions = [
		AddDemographic,
		AddConditionEra,
		AddConditionOccurrence,
		AddDeath,
		AddDeviceExposure,
		AddDoseEra,
		AddDrugEra,
		AddDrugExposure,
		AddLocationRegion,
		AddMeasurement,
		AddObservation,
		AddObservationPeriod,
		AddPayerPlanPeriod,
		AddProcedureOccurrence,
		AddSpecimen,
		AddVisit,
		AddGroup,
	];

	const AddWindowedCriteriaActions = [
		AddDemographic,
		AddConditionEra,
		AddConditionOccurrence,
		AddDeath,
		AddDeviceExposure,
		AddDoseEra,
		AddDrugEra,
		AddDrugExposure,
		AddLocationRegion,
		AddMeasurement,
		AddObservation,
		AddObservationPeriod,
		AddPayerPlanPeriod,
		AddProcedureOccurrence,
		AddSpecimen,
		AddVisit,
	];

	return {
		CriteriaTypes,
		AddCriteriaActions,
		AddWindowedCriteriaActions,
	};
});