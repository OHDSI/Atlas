define((require, Application, exports) => {

	const ko = require('knockout');
	//todo yar this way we guaranty that i18n is already in ok. think about alternative way to do so...
	const appConfig = require('appConfig');


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
		text: ko.unwrap(ko.i18n("cc.viewEdit.design.subgroups.add.demographic.text", "Add Demographic")),
		selected: false,
		description: ko.unwrap(ko.i18n("cc.viewEdit.design.subgroups.add.demographic.description", "Filter events based on demographic criteria.")),
		type: CriteriaTypes.DEMOGRAPHIC,
	};
	const AddConditionEra = {
		text: ko.unwrap(ko.i18n("cc.viewEdit.design.subgroups.add.condition-era.text", "Add Condition Era")),
		selected: false,
		description: ko.unwrap(ko.i18n("cc.viewEdit.design.subgroups.add.condition-era.description", "Find patients with specific condition era.")),
		type: CriteriaTypes.CONDITION_ERA,
	};
	const AddConditionOccurrence = {
		text: ko.unwrap(ko.i18n("cc.viewEdit.design.subgroups.add.condition-occurrence.text", "Add Condition Occurrence")),
		selected: false,
		description: ko.unwrap(ko.i18n("cc.viewEdit.design.subgroups.add.condition-occurrence.tedescriptionxt", "Find patients with specific conditions.")),
		type: CriteriaTypes.CONDITION_OCCURRENCE,
	};
	const AddDeath = {
		text: ko.unwrap(ko.i18n("cc.viewEdit.design.subgroups.add.death.text", "Add Death")),
		selected: false,
		description: ko.unwrap(ko.i18n("cc.viewEdit.design.subgroups.add.death.description", "Find patients based on death.")),
		type: CriteriaTypes.DEATH,
	};
	const AddDeviceExposure = {
		text: ko.unwrap(ko.i18n("cc.viewEdit.design.subgroups.add.device-exposure.text", "Add Device Exposure")),
		selected: false,
		description: ko.unwrap(ko.i18n("cc.viewEdit.design.subgroups.add.device-exposure.description", "Find patients based on device exposure.")),
		type: CriteriaTypes.DEVICE_EXPOSURE,
	};
	const AddDoseEra = {
		text: ko.unwrap(ko.i18n("cc.viewEdit.design.subgroups.add.dose-era.text", "Add Dose Era")),
		selected: false,
		description: ko.unwrap(ko.i18n("cc.viewEdit.design.subgroups.add.dose-era.description", "Find patients with dose eras.")),
		type: CriteriaTypes.DOSE_ERA,
	};
	const AddDrugEra = {
		text: ko.unwrap(ko.i18n("cc.viewEdit.design.subgroups.add.drug-era.text", "Add Drug Era")),
		selected: false,
		description: ko.unwrap(ko.i18n("cc.viewEdit.design.subgroups.add.drug-era.description", "Find patients with drug eras.")),
		type: CriteriaTypes.DRUG_ERA,
	};
	const AddDrugExposure = {
		text: ko.unwrap(ko.i18n("cc.viewEdit.design.subgroups.add.drug-exposure.text", "Add Drug Exposure")),
		selected: false,
		description: ko.unwrap(ko.i18n("cc.viewEdit.design.subgroups.add.drug-exposure.description", "Find patients with exposure to specific drugs or drug classes.")),
		type: CriteriaTypes.DRUG_EXPOSURE,
	};

	const AddLocationRegion = {
		text: ko.unwrap(ko.i18n("cc.viewEdit.design.subgroups.add.location-region.text", "Add Location Region")),
		selected: false,
		description: ko.unwrap(ko.i18n("cc.viewEdit.design.subgroups.add.location-region.description", "Find patients within geographical area.")),
		type: CriteriaTypes.LOCATION_REGION,
	};

	const AddMeasurement = {
		text: ko.unwrap(ko.i18n("cc.viewEdit.design.subgroups.add.measurement.text", "Add Measurement")),
		selected: false,
		description: ko.unwrap(ko.i18n("cc.viewEdit.design.subgroups.add.measurement.description", "Find patients based on measurements.")),
		type: CriteriaTypes.MEASUREMENT,
	};
	const AddObservation = {
		text: ko.unwrap(ko.i18n("cc.viewEdit.design.subgroups.add.observation.text", "Add Observation")),
		selected: false,
		description: ko.unwrap(ko.i18n("cc.viewEdit.design.subgroups.add.observation.description", "Find patients based on observations.")),
		type: CriteriaTypes.OBSERVATION,
	};
	const AddObservationPeriod = {
		text: ko.unwrap(ko.i18n("cc.viewEdit.design.subgroups.add.observation-period.text", "Add Observation Period")),
		selected: false,
		description: ko.unwrap(ko.i18n("cc.viewEdit.design.subgroups.add.observation-period.description", "Find patients based on observation periods.")),
		type: CriteriaTypes.OBSERVATION_PERIOD,
	};
	const AddPayerPlanPeriod = {
		text: ko.unwrap(ko.i18n("cc.viewEdit.design.subgroups.add.payer-plan-period.text", "Add Payer Plan Period")),
		selected: false,
		description: ko.unwrap(ko.i18n("cc.viewEdit.design.subgroups.add.payer-plan-period.description", "Find patients based on Payer Plan Period.")),
		type: CriteriaTypes.PAYER_PLAN_PERIOD,
	};
	const AddProcedureOccurrence = {
		text: ko.unwrap(ko.i18n("cc.viewEdit.design.subgroups.add.procedure-occurrence.text", "Add Procedure Occurrence")),
		selected: false,
		description: ko.unwrap(ko.i18n("cc.viewEdit.design.subgroups.add.procedure-occurrence.description", "Find patients that experienced a specific procedure.")),
		type: CriteriaTypes.PROCEDURE_OCCURRENCE,
	};
	const AddSpecimen = {
		text: ko.unwrap(ko.i18n("cc.viewEdit.design.subgroups.add.specimen.text", "Add Specimen")),
		selected: false,
		description: ko.unwrap(ko.i18n("cc.viewEdit.design.subgroups.add.specimen.description", "Find patients based on specimen.")),
		type: CriteriaTypes.SPECIMEN,
	};
	const AddVisit = {
		text: ko.unwrap(ko.i18n("cc.viewEdit.design.subgroups.add.visit.text", "Visit")),
		selected: false,
		description: ko.unwrap(ko.i18n("cc.viewEdit.design.subgroups.add.visit.description", "Find patients based on visit information.")),
		type: CriteriaTypes.VISIT,
	};
	const AddGroup = {
		text: ko.unwrap(ko.i18n("cc.viewEdit.design.subgroups.add.group.text", "Add Group")),
		selected: false,
		description: ko.unwrap(ko.i18n("cc.viewEdit.design.subgroups.add.group.description", "Add a group to combine criteria using and/or relationships.")),
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