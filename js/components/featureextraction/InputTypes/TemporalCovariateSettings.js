define(['knockout'], function (ko) {

	function TemporalCovariateSettings(data) {
		var self = this;
		data = data || {};

        self.useDemographicsGender = ko.observable(data.useDemographicsGender === 0 ? 0 : data.useDemographicsGender || 0);
        self.useDemographicsAge = ko.observable(data.useDemographicsAge === 0 ? 0 : data.useDemographicsAge || 0);
        self.useDemographicsAgeGroup = ko.observable(data.useDemographicsAgeGroup === 0 ? 0 : data.useDemographicsAgeGroup || 0);
        self.useDemographicsRace = ko.observable(data.useDemographicsRace === 0 ? 0 : data.useDemographicsRace || 0);
        self.useDemographicsEthnicity = ko.observable(data.useDemographicsEthnicity === 0 ? 0 : data.useDemographicsEthnicity || 0);
        self.useDemographicsIndexYear = ko.observable(data.useDemographicsIndexYear === 0 ? 0 : data.useDemographicsIndexYear || 0);
        self.useDemographicsIndexMonth = ko.observable(data.useDemographicsIndexMonth === 0 ? 0 : data.useDemographicsIndexMonth || 0);
        self.useDemographicsPriorObservationTime = ko.observable(data.useDemographicsPriorObservationTime === 0 ? 0 : data.useDemographicsPriorObservationTime || 0);
        self.useDemographicsPostObservationTime = ko.observable(data.useDemographicsPostObservationTime === 0 ? 0 : data.useDemographicsPostObservationTime || 0);
        self.useDemographicsTimeInCohort = ko.observable(data.useDemographicsTimeInCohort === 0 ? 0 : data.useDemographicsTimeInCohort || 0);
        self.useDemographicsIndexYearMonth = ko.observable(data.useDemographicsIndexYearMonth === 0 ? 0 : data.useDemographicsIndexYearMonth || 0);
        self.useConditionOccurrence = ko.observable(data.useConditionOccurrence === 0 ? 0 : data.useConditionOccurrence || 0);
        self.useConditionOccurrencePrimaryInpatient = ko.observable(data.useConditionOccurrencePrimaryInpatient === 0 ? 0 : data.useConditionOccurrencePrimaryInpatient || 0);
        self.useConditionEraStart = ko.observable(data.useConditionEraStart === 0 ? 0 : data.useConditionEraStart || 0);
        self.useConditionEraOverlap = ko.observable(data.useConditionEraOverlap === 0 ? 0 : data.useConditionEraOverlap || 0);
        self.useConditionEraGroupStart = ko.observable(data.useConditionEraGroupStart === 0 ? 0 : data.useConditionEraGroupStart || 0);
        self.useConditionEraGroupOverlap = ko.observable(data.useConditionEraGroupOverlap === 0 ? 0 : data.useConditionEraGroupOverlap || 0);
        self.useDrugExposure = ko.observable(data.useDrugExposure === 0 ? 0 : data.useDrugExposure || 0);
        self.useDrugEraStart = ko.observable(data.useDrugEraStart === 0 ? 0 : data.useDrugEraStart || 0);
        self.useDrugEraOverlap = ko.observable(data.useDrugEraOverlap === 0 ? 0 : data.useDrugEraOverlap || 0);
        self.useDrugEraGroupStart = ko.observable(data.useDrugEraGroupStart === 0 ? 0 : data.useDrugEraGroupStart || 0);
        self.useDrugEraGroupOverlap = ko.observable(data.useDrugEraGroupOverlap === 0 ? 0 : data.useDrugEraGroupOverlap || 0);
        self.useProcedureOccurrence = ko.observable(data.useProcedureOccurrence === 0 ? 0 : data.useProcedureOccurrence || 0);
        self.useDeviceExposure = ko.observable(data.useDeviceExposure === 0 ? 0 : data.useDeviceExposure || 0);
        self.useMeasurement = ko.observable(data.useMeasurement === 0 ? 0 : data.useMeasurement || 0);
        self.useMeasurementValue = ko.observable(data.useMeasurementValue === 0 ? 0 : data.useMeasurementValue || 0);
        self.useMeasurementRangeGroup = ko.observable(data.useMeasurementRangeGroup === 0 ? 0 : data.useMeasurementRangeGroup || 0);
        self.useObservation = ko.observable(data.useObservation === 0 ? 0 : data.useObservation || 0);
        self.useCharlsonIndex = ko.observable(data.useCharlsonIndex === 0 ? 0 : data.useCharlsonIndex || 0);
        self.useDcsi = ko.observable(data.useDcsi === 0 ? 0 : data.useDcsi || 0);
        self.useChads2 = ko.observable(data.useChads2 === 0 ? 0 : data.useChads2 || 0);
        self.useChads2Vasc = ko.observable(data.useChads2Vasc === 0 ? 0 : data.useChads2Vasc || 0);
        self.useDistinctConditionCount = ko.observable(data.useDistinctConditionCount === 0 ? 0 : data.useDistinctConditionCount || 0);
        self.useDistinctIngredientCount = ko.observable(data.useDistinctIngredientCount === 0 ? 0 : data.useDistinctIngredientCount || 0);
        self.useDistinctProcedureCount = ko.observable(data.useDistinctProcedureCount === 0 ? 0 : data.useDistinctProcedureCount || 0);
        self.useDistinctMeasurementCount = ko.observable(data.useDistinctMeasurementCount === 0 ? 0 : data.useDistinctMeasurementCount || 0);
        self.useDistinctObservationCount = ko.observable(data.useDistinctObservationCount === 0 ? 0 : data.useDistinctObservationCount || 0);
        self.useVisitCount = ko.observable(data.useVisitCount === 0 ? 0 : data.useVisitCount || 0);
        self.useVisitConceptCount = ko.observable(data.useVisitConceptCount === 0 ? 0 : data.useVisitConceptCount || 0);
        self.temporalStartDays = ko.observable(data.temporalStartDays != null ? data.temporalStartDays : "-365:-1")
        self.temporalEndDays = ko.observable(data.temporalEndDays != null ? data.temporalEndDays : "-365:-1")
        self.includedCovariateConceptIds = ko.observable(data.includedCovariateConceptIds === 0 ? "" : data.includedCovariateConceptIds || "");
        self.addDescendantsToInclude = ko.observable(data.addDescendantsToInclude === 0 ? false : data.addDescendantsToInclude  || false);
        self.excludedCovariateConceptIds = ko.observable(data.excludedCovariateConceptIds === 0 ? "" : data.excludedCovariateConceptIds || "");
        self.addDescendantsToExclude = ko.observable(data.addDescendantsToExclude === 0 ? false : data.addDescendantsToExclude || false);
        self.includedCovariateIds = ko.observable(data.includedCovariateIds === 0 ? "" : data.includedCovariateIds || "");
        self.attr_fun = data.attr_fun || "getDbDefaultCovariateData";
        self.attr_class = data.attr_class || "covariateSettings";
	}
	
	return TemporalCovariateSettings;
});