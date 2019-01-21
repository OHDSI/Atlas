define([
    'knockout',
    'services/analysis/RLangClass',
    'lodash'
], 
function (
    ko,
    RLangClass,
    _
) {
	class TemporalCovariateSettings extends RLangClass {
        constructor(data = {}) {
            super({"attr_class": "covariateSettings"});
            this.temporal = ko.observable(data.temporal === 0 ? false : data.temporal || true);
            this.DemographicsGender = ko.observable(data.DemographicsGender === 0 ? 0 : data.DemographicsGender || false);
            this.DemographicsAge = ko.observable(data.DemographicsAge === 0 ? 0 : data.DemographicsAge || false);
            this.DemographicsAgeGroup = ko.observable(data.DemographicsAgeGroup === 0 ? 0 : data.DemographicsAgeGroup || false);
            this.DemographicsRace = ko.observable(data.DemographicsRace === 0 ? 0 : data.DemographicsRace || false);
            this.DemographicsEthnicity = ko.observable(data.DemographicsEthnicity === 0 ? 0 : data.DemographicsEthnicity || false);
            this.DemographicsIndexYear = ko.observable(data.DemographicsIndexYear === 0 ? 0 : data.DemographicsIndexYear || false);
            this.DemographicsIndexMonth = ko.observable(data.DemographicsIndexMonth === 0 ? 0 : data.DemographicsIndexMonth || false);
            this.DemographicsPriorObservationTime = ko.observable(data.DemographicsPriorObservationTime === 0 ? 0 : data.DemographicsPriorObservationTime || false);
            this.DemographicsPostObservationTime = ko.observable(data.DemographicsPostObservationTime === 0 ? 0 : data.DemographicsPostObservationTime || false);
            this.DemographicsTimeInCohort = ko.observable(data.DemographicsTimeInCohort === 0 ? 0 : data.DemographicsTimeInCohort || false);
            this.DemographicsIndexYearMonth = ko.observable(data.DemographicsIndexYearMonth === 0 ? 0 : data.DemographicsIndexYearMonth || false);
            this.ConditionOccurrence = ko.observable(data.ConditionOccurrence === 0 ? 0 : data.ConditionOccurrence || false);
            this.ConditionOccurrencePrimaryInpatient = ko.observable(data.ConditionOccurrencePrimaryInpatient === 0 ? 0 : data.ConditionOccurrencePrimaryInpatient || false);
            this.ConditionEraStart = ko.observable(data.ConditionEraStart === 0 ? 0 : data.ConditionEraStart || false);
            this.ConditionEraOverlap = ko.observable(data.ConditionEraOverlap === 0 ? 0 : data.ConditionEraOverlap || false);
            this.ConditionEraGroupStart = ko.observable(data.ConditionEraGroupStart === 0 ? 0 : data.ConditionEraGroupStart || false);
            this.ConditionEraGroupOverlap = ko.observable(data.ConditionEraGroupOverlap === 0 ? 0 : data.ConditionEraGroupOverlap || false);
            this.DrugExposure = ko.observable(data.DrugExposure === 0 ? 0 : data.DrugExposure || false);
            this.DrugEraStart = ko.observable(data.DrugEraStart === 0 ? 0 : data.DrugEraStart || false);
            this.DrugEraOverlap = ko.observable(data.DrugEraOverlap === 0 ? 0 : data.DrugEraOverlap || false);
            this.DrugEraGroupStart = ko.observable(data.DrugEraGroupStart === 0 ? 0 : data.DrugEraGroupStart || false);
            this.DrugEraGroupOverlap = ko.observable(data.DrugEraGroupOverlap === 0 ? 0 : data.DrugEraGroupOverlap || false);
            this.ProcedureOccurrence = ko.observable(data.ProcedureOccurrence === 0 ? 0 : data.ProcedureOccurrence || false);
            this.DeviceExposure = ko.observable(data.DeviceExposure === 0 ? 0 : data.DeviceExposure || false);
            this.Measurement = ko.observable(data.Measurement === 0 ? 0 : data.Measurement || false);
            this.MeasurementValue = ko.observable(data.MeasurementValue === 0 ? 0 : data.MeasurementValue || false);
            this.MeasurementRangeGroup = ko.observable(data.MeasurementRangeGroup === 0 ? 0 : data.MeasurementRangeGroup || false);
            this.Observation = ko.observable(data.Observation === 0 ? 0 : data.Observation || false);
            this.CharlsonIndex = ko.observable(data.CharlsonIndex === 0 ? 0 : data.CharlsonIndex || false);
            this.Dcsi = ko.observable(data.Dcsi === 0 ? 0 : data.Dcsi || false);
            this.Chads2 = ko.observable(data.Chads2 === 0 ? 0 : data.Chads2 || false);
            this.Chads2Vasc = ko.observable(data.Chads2Vasc === 0 ? 0 : data.Chads2Vasc || false);
            this.DistinctConditionCount = ko.observable(data.DistinctConditionCount === 0 ? 0 : data.DistinctConditionCount || false);
            this.DistinctIngredientCount = ko.observable(data.DistinctIngredientCount === 0 ? 0 : data.DistinctIngredientCount || false);
            this.DistinctProcedureCount = ko.observable(data.DistinctProcedureCount === 0 ? 0 : data.DistinctProcedureCount || false);
            this.DistinctMeasurementCount = ko.observable(data.DistinctMeasurementCount === 0 ? 0 : data.DistinctMeasurementCount || false);
            this.DistinctObservationCount = ko.observable(data.DistinctObservationCount === 0 ? 0 : data.DistinctObservationCount || false);
            this.VisitCount = ko.observable(data.VisitCount === 0 ? 0 : data.VisitCount || false);
            this.VisitConceptCount = ko.observable(data.VisitConceptCount === 0 ? 0 : data.VisitConceptCount || false);
            this.temporalStartDays = ko.observableArray((data.temporalStartDays && Array.isArray(data.temporalStartDays)) ? data.temporalStartDays : _.range(-365,0));
            this.temporalEndDays = ko.observableArray((data.temporalEndDays && Array.isArray(data.temporalEndDays)) ? data.temporalEndDays : _.range(-365,0));
            this.includedCovariateConceptIds = ko.observableArray((data.includedCovariateConceptIds && Array.isArray(data.includedCovariateConceptIds)) ? data.includedCovariateConceptIds : []);
            this.addDescendantsToInclude = ko.observable(data.addDescendantsToInclude === 0 ? false : data.addDescendantsToInclude  || false);
            this.excludedCovariateConceptIds = ko.observableArray((data.excludedCovariateConceptIds && Array.isArray(data.excludedCovariateConceptIds)) ? data.excludedCovariateConceptIds : []);
            this.addDescendantsToExclude = ko.observable(data.addDescendantsToExclude === 0 ? false : data.addDescendantsToExclude || false);
            this.includedCovariateIds = ko.observableArray((data.includedCovariateIds && Array.isArray(data.includedCovariateIds)) ? data.includedCovariateIds : []);
            this.attr_fun = data.attr_fun || "getDbDefaultCovariateData";
        }
	}
	
	return TemporalCovariateSettings;
});