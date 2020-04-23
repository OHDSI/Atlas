define(["knockout"
],
function (
	ko
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

	const eventsList = {
		addFirstDiagnosisCriteria: {
			title: ko.i18n('const.eventsList.addFirstDiagnosisCriteria.title', 'Add First Diagnosis Criteria'),
			desc: ko.i18n('const.eventsList.addFirstDiagnosisCriteria.desc', 'Limit Condition Eras to first diagnosis era in history.'),
		},
		addAgeAtEraStartCriteria: {
			title: ko.i18n('const.eventsList.addAgeAtEraStartCriteria.title', 'Add Age at Era Start Criteria'),
			desc: ko.i18n('const.eventsList.addAgeAtEraStartCriteria.desc', 'Filter Condition Eras by age at era start.'),
		},
		addAgeAtEraEndCriteria: {
			title: ko.i18n('const.eventsList.addAgeAtEraEndCriteria.title', 'Add Age at Era End Criteria'),
			desc: ko.i18n('const.eventsList.addAgeAtEraEndCriteria.desc', 'Filter Condition Eras by age at era end.'),
		},
		addGenderCriteria: {
			title: ko.i18n('const.eventsList.addGenderCriteria.title', 'Add Gender Criteria'),
			desc: ko.i18n('const.eventsList.addGenderCriteria.desc', 'Filter Condition Eras based on Gender.'),
			desc_second: ko.i18n('const.eventsList.addGenderCriteria.desc_second', 'Filter events based on Gender.'),
		},
		addStartDateCriteria: {
			title: ko.i18n('const.eventsList.addStartDateCriteria.title', 'Add Start Date Criteria'),
			desc: ko.i18n('const.eventsList.addStartDateCriteria.desc', 'Filter Condition Eras by the Era Start Date.'),
		},
		addEndDateCriteria: {
			title: ko.i18n('const.eventsList.addEndDateCriteria.title', 'Add End Date Criteria'),
			desc: ko.i18n('const.eventsList.addEndDateCriteria.desc', 'Filter Condition Eras  by the Era End Date'),
		},
		addEraConditonCountCriteria: {
			title: ko.i18n('const.eventsList.addEraConditonCountCriteria.title', 'Add Era Conditon Count Criteria'),
			desc: ko.i18n('const.eventsList.addEraConditonCountCriteria.desc', 'Filter Condition Eras by the Condition Count.'),
		},
		addEraLengthCriteria: {
			title: ko.i18n('const.eventsList.addEraLengthCriteria.title', 'Add Era Length Criteria'),
			desc: ko.i18n('const.eventsList.addEraLengthCriteria.desc', 'Filter Condition Eras by the Era duration.'),
		},
		addNestedCriteria: {
			title: ko.i18n('const.eventsList.addNestedCriteria.title', 'Add Nested Criteria...'),
			desc: ko.i18n('const.eventsList.addNestedCriteria.desc', 'Apply criteria using the condition era as the index event'),
		},
		addConditionEra: {
			title: ko.i18n('const.eventsList.addConditionEra.title', 'Add Condition Era'),
			desc: ko.i18n('const.eventsList.addConditionEra.desc', 'Find patients with specific diagosis era.'), //'Find patients with specific diagosis era.'
			desc_second: ko.i18n('const.eventsList.addConditionEra.desc_second', 'Exit cohort based on diagosis era.'),
			desc_third: ko.i18n('const.eventsList.addConditionEra.third_third', 'Find patients with specific condition era.'), 
		},
		addConditionOccurrence: {
			title: ko.i18n('const.eventsList.addConditionOccurrence.title', 'Add Condition Occurrence'),
			desc: ko.i18n('const.eventsList.addConditionOccurrence.desc', 'Find patients with specific diagnoses.'),
			desc_second: ko.i18n('const.eventsList.addConditionOccurrence.desc_second', 'Exit cohort based on  diagnoses'),
			desc_third: ko.i18n('const.eventsList.addConditionOccurrence.desc_third', 'Find patients with specific conditions.')
		},
		addDeath: {
			title: ko.i18n('const.eventsList.addDeath.title', 'Add Death'),
			desc: ko.i18n('const.eventsList.addDeath.desc', 'Find patients based on death.'),
			desc_second: ko.i18n('const.eventsList.addDeath.desc_second', 'Exit cohort based on  death.')
		},
		addDeviceExposure: {
			title: ko.i18n('const.eventsList.addDeviceExposure.title', 'Add Device Exposure'),
			desc: ko.i18n('const.eventsList.addDeviceExposure.desc', 'Find patients based on device exposure.'),
			desc_second: ko.i18n('const.eventsList.addDeviceExposure.desc_second', 'Exit cohort based on  device exposure.')
		},
		addDoseEra: {
			title: ko.i18n('const.eventsList.addDoseEra.title', 'Add Dose Era'),
			desc: ko.i18n('const.eventsList.addDoseEra.desc', 'Find patients with dose eras.'),
			desc_second: ko.i18n('const.eventsList.addDoseEra.desc_second', 'Exit cohort based on dose eras.')
		},
		addDrugEra: {
			title: ko.i18n('const.eventsList.addDrugEra.title', 'Add Drug Era'),
			desc: ko.i18n('const.eventsList.addDrugEra.desc', 'Find patients with with exposure to drugs over time.'),
			desc_second: ko.i18n('const.eventsList.addDrugEra.desc_second', 'Exit cohort based on drugs over time.')
		},
		addDrugExposure: {
			title: ko.i18n('const.eventsList.addDrugExposure.title', 'Add Drug Exposure'),
			desc: ko.i18n('const.eventsList.addDrugExposure.desc', 'Find patients with exposure to specific drugs or drug classes.'),
			desc_second: ko.i18n('const.eventsList.addDrugExposure.desc_second', 'Exit cohort based on exposure to specific drugs or drug classes.')
		},
		addMeasurement: {
			title: ko.i18n('const.eventsList.addMeasurement.title', 'Add Measurement'),
			desc: ko.i18n('const.eventsList.addMeasurement.desc', 'Find patients based on Measurement.'),
			desc_second: ko.i18n('const.eventsList.addMeasurement.desc_second', 'Exit cohort based on Measurement.')
		},
		addObservation: {
			title: ko.i18n('const.eventsList.addObservation.title', 'Add Observation'),
			desc: ko.i18n('const.eventsList.addObservation.desc', 'Find patients based on lab tests or other observations..'),
			desc_second: ko.i18n('const.eventsList.addObservation.desc_second', 'Exit cohort based on lab tests or other observations.')
		},
		addObservationPeriod: {
			title: ko.i18n('const.eventsList.addObservationPeriod.title', 'Add Observation Period'),
			desc: ko.i18n('const.eventsList.addObservationPeriod.desc', 'Find patients based on Observation Period.'),
		},
		addPayerPlanPeriod: {
			title: ko.i18n('const.eventsList.addPayerPlanPeriod.title', 'Add Payer Plan Period'),
			desc: ko.i18n('const.eventsList.addPayerPlanPeriod.desc', 'Find patients based on Payer Plan Period.'),
			desc_second: ko.i18n('const.eventsList.addPayerPlanPeriod.desc_second', 'Find patients based on Payer Plan Period.')
		},
		addProcedureOccurrence: {
			title: ko.i18n('const.eventsList.addProcedureOccurrence.title', 'Add Procedure Occurrence'),
			desc: ko.i18n('const.eventsList.addProcedureOccurrence.desc', 'Find patients that experienced a specific procedure.'),
			desc_second: ko.i18n('const.eventsList.addProcedureOccurrence.desc_second', 'Exit cohort based on procedures.')
		},
		addSpecimen: {
			title: ko.i18n('const.eventsList.addSpecimen.title', 'Add Specimen'),
			desc: ko.i18n('const.eventsList.addSpecimen.desc', 'Find patients based on Specimen.'),
			desc_second: ko.i18n('const.eventsList.addSpecimen.desc_second', 'Find patients based on Specimen.')
		},
		addVisit: {
			title: ko.i18n('const.eventsList.addVisit.title', 'Add Visit'),
			desc: ko.i18n('const.eventsList.addVisit.desc', 'Find patients based on visit information.'),
			desc_second: ko.i18n('const.eventsList.addVisit.desc_second', 'Exit cohort based on visit information.')
		},
		addAgeCriteria: {
			title: ko.i18n('const.eventsList.addAgeCriteria.title', 'Add Age Criteria'),
			desc: ko.i18n('const.eventsList.addAgeCriteria.desc', 'Filter events based on age.'),
		},
		addEventStartDateCriteria: {
			title: ko.i18n('const.eventsList.addEventStartDateCriteria.title', 'Add Event Start Date Criteria'),
			desc: ko.i18n('const.eventsList.addEventStartDateCriteria.desc', 'Filter Events by Start Date.'),
		},
		addEventEndDateCriteria: {
			title: ko.i18n('const.eventsList.addEventEndDateCriteria.title', 'Add Event End Date Criteria'),
			desc: ko.i18n('const.eventsList.addEventEndDateCriteria.desc', 'Filter Events by End Date.'),
		},
		addRaceCriteria: {
			title: ko.i18n('const.eventsList.addRaceCriteria.title', 'Add Race Criteria'),
			desc: ko.i18n('const.eventsList.addRaceCriteria.desc', 'Filter events based on Gender.'),
		},
		addEthnicityCriteria: {
			title: ko.i18n('const.eventsList.addEthnicityCriteria.title', 'Add Ethnicity Criteria'),
			desc: ko.i18n('const.eventsList.addEthnicityCriteria.desc', 'Filter events based on Ethnicity.'),
		},
		addDemographic: {
			title: ko.i18n('const.eventsList.addDemographic.title', 'Add Demographic'),
			desc: ko.i18n('const.eventsList.addDemographic.desc', 'Filter events based on demographic criteria.'),
		}
	}

	const initialEventList = {
		addConditionEra: {
			title: ko.i18n('const.initialEventList.addConditionEra.title', 'Add Condition Era'), //'Add Condition Era',
			desc: ko.i18n('const.initialEventList.addConditionEra.desc', 'Find patients with specific diagosis era.'), //'Find patients with specific diagosis era.'
		},
		addConditionOccurrence: {
			title: ko.i18n('const.initialEventList.addConditionOccurrence.title', 'Add Condition Occurrence'),
			desc: ko.i18n('const.initialEventList.addConditionOccurrence.desc', 'Find patients with specific diagnoses.'),
		},
		addDeath: {
			title: ko.i18n('const.initialEventList.addDeath.title', 'Add Death'),
			desc: ko.i18n('const.initialEventList.addDeath.desc', 'Find patients based on death.'),
		},
		addDeviceExposure: {
			title: ko.i18n('const.initialEventList.addDeviceExposure.title', 'Add Device Exposure'),
			desc: ko.i18n('const.initialEventList.addDeviceExposure.desc', 'Find patients based on device exposure.'),
		},
		addDoseEra: {
			title: ko.i18n('const.initialEventList.addDoseEra.title', 'Add Dose Era'),
			desc: ko.i18n('const.initialEventList.addDoseEra.desc', 'Find patients with dose eras.'),
		},
		addDrugEra: {
			title: ko.i18n('const.initialEventList.addDrugEra.title', 'Add Drug Era'),
			desc: ko.i18n('const.initialEventList.addDrugEra.desc', 'Find patients with with exposure to drugs over time.'),
		},
		addDrugExposure: {
			title: ko.i18n('const.initialEventList.addDrugExposure.title', 'Add Drug Exposure'),
			desc: ko.i18n('const.initialEventList.addDrugExposure.desc', 'Find patients with exposure to specific drugs or drug classes.'),
		},
		addMeasurement: {
			title: ko.i18n('const.initialEventList.addMeasurement.title', 'Add Measurement'),
			desc: ko.i18n('const.initialEventList.addMeasurement.desc', 'Find patients based on Measurement.'),
		},
		addObservation: {
			title: ko.i18n('const.initialEventList.addObservation.title', 'Add Observation'),
			desc: ko.i18n('const.initialEventList.addObservation.desc', 'Find patients based on lab tests or other observations..'),
		},
		addObservationPeriod: {
			title: ko.i18n('const.initialEventList.addObservationPeriod.title', 'Add Observation Period'),
			desc: ko.i18n('const.initialEventList.addObservationPeriod.desc', 'Find patients based on Observation Period.'),
		},
		addPayerPlanPeriod: {
			title: ko.i18n('const.initialEventList.addPayerPlanPeriod.title', 'Add Payer Plan Period'),
			desc: ko.i18n('const.initialEventList.addPayerPlanPeriod.desc', 'Find patients based on Payer Plan Period.'),
		},
		addProcedureOccurrence: {
			title: ko.i18n('const.initialEventList.addProcedureOccurrence.title', 'Add Procedure Occurrence'),
			desc: ko.i18n('const.initialEventList.addProcedureOccurrence.desc', 'Find patients that experienced a specific procedure.'),
		},
		addSpecimen: {
			title: ko.i18n('const.initialEventList.addSpecimen.title', 'Add Specimen'),
			desc: ko.i18n('const.initialEventList.addSpecimen.desc', 'Find patients based on Specimen.'),
		},
		addVisit: {
			title: ko.i18n('const.initialEventList.addVisit.title', 'Add Visit'),
			desc: ko.i18n('const.initialEventList.addVisit.desc', 'Find patients based on visit information.'),
		}
	}

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

	const DateRange = {
		
	}

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
		initialEventList,
		eventsList,
	};
});