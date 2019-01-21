define([
    'knockout', 
    'services/analysis/RLangClass',
    'databindings'
], function (
    ko,
    RLangClass
) {
    class CovariateSettings extends RLangClass {
        constructor(data = {}) {
            super({"attr_class": "covariateSettings"});
            this.temporal = ko.observable(data.temporal === 0 ? false : data.temporal || false);
            this.DemographicsGender = ko.observable(data.DemographicsGender === 0 ? false : data.DemographicsGender || false);
            this.DemographicsAge = ko.observable(data.DemographicsAge === 0 ? false : data.DemographicsAge || false);
            this.DemographicsAgeGroup = ko.observable(data.DemographicsAgeGroup === 0 ? false : data.DemographicsAgeGroup || false);
            this.DemographicsRace = ko.observable(data.DemographicsRace === 0 ? false : data.DemographicsRace || false);
            this.DemographicsEthnicity = ko.observable(data.DemographicsEthnicity === 0 ? false : data.DemographicsEthnicity || false);
            this.DemographicsIndexYear = ko.observable(data.DemographicsIndexYear === 0 ? false : data.DemographicsIndexYear || false);
            this.DemographicsIndexMonth = ko.observable(data.DemographicsIndexMonth === 0 ? false : data.DemographicsIndexMonth || false);
            this.DemographicsPriorObservationTime = ko.observable(data.DemographicsPriorObservationTime === 0 ? false : data.DemographicsPriorObservationTime || false);
            this.DemographicsPostObservationTime = ko.observable(data.DemographicsPostObservationTime === 0 ? false : data.DemographicsPostObservationTime || false);
            this.DemographicsTimeInCohort = ko.observable(data.DemographicsTimeInCohort === 0 ? false : data.DemographicsTimeInCohort || false);
            this.DemographicsIndexYearMonth = ko.observable(data.DemographicsIndexYearMonth === 0 ? false : data.DemographicsIndexYearMonth || false);
            this.ConditionOccurrenceAnyTimePrior = ko.observable(data.ConditionOccurrenceAnyTimePrior === 0 ? false : data.ConditionOccurrenceAnyTimePrior || false);
            this.ConditionOccurrenceLongTerm = ko.observable(data.ConditionOccurrenceLongTerm === 0 ? false : data.ConditionOccurrenceLongTerm || false);
            this.ConditionOccurrenceMediumTerm = ko.observable(data.ConditionOccurrenceMediumTerm === 0 ? false : data.ConditionOccurrenceMediumTerm || false);
            this.ConditionOccurrenceShortTerm = ko.observable(data.ConditionOccurrenceShortTerm === 0 ? false : data.ConditionOccurrenceShortTerm || false);
            this.ConditionOccurrencePrimaryInpatientAnyTimePrior = ko.observable(data.ConditionOccurrencePrimaryInpatientAnyTimePrior === 0 ? false : data.ConditionOccurrencePrimaryInpatientAnyTimePrior || false);
            this.ConditionOccurrencePrimaryInpatientLongTerm = ko.observable(data.ConditionOccurrencePrimaryInpatientLongTerm === 0 ? false : data.ConditionOccurrencePrimaryInpatientLongTerm || false);
            this.ConditionOccurrencePrimaryInpatientMediumTerm = ko.observable(data.ConditionOccurrencePrimaryInpatientMediumTerm === 0 ? false : data.ConditionOccurrencePrimaryInpatientMediumTerm || false);
            this.ConditionOccurrencePrimaryInpatientShortTerm = ko.observable(data.ConditionOccurrencePrimaryInpatientShortTerm === 0 ? false : data.ConditionOccurrencePrimaryInpatientShortTerm || false);
            this.ConditionEraAnyTimePrior = ko.observable(data.ConditionEraAnyTimePrior === 0 ? false : data.ConditionEraAnyTimePrior || false);
            this.ConditionEraLongTerm = ko.observable(data.ConditionEraLongTerm === 0 ? false : data.ConditionEraLongTerm || false);
            this.ConditionEraMediumTerm = ko.observable(data.ConditionEraMediumTerm === 0 ? false : data.ConditionEraMediumTerm || false);
            this.ConditionEraShortTerm = ko.observable(data.ConditionEraShortTerm === 0 ? false : data.ConditionEraShortTerm || false);
            this.ConditionEraOverlapping = ko.observable(data.ConditionEraOverlapping === 0 ? false : data.ConditionEraOverlapping || false);
            this.ConditionEraStartLongTerm = ko.observable(data.ConditionEraStartLongTerm === 0 ? false : data.ConditionEraStartLongTerm || false);
            this.ConditionEraStartMediumTerm = ko.observable(data.ConditionEraStartMediumTerm === 0 ? false : data.ConditionEraStartMediumTerm || false);
            this.ConditionEraStartShortTerm = ko.observable(data.ConditionEraStartShortTerm === 0 ? false : data.ConditionEraStartShortTerm || false);
            this.ConditionGroupEraAnyTimePrior = ko.observable(data.ConditionGroupEraAnyTimePrior === 0 ? false : data.ConditionGroupEraAnyTimePrior || false);
            this.ConditionGroupEraLongTerm = ko.observable(data.ConditionGroupEraLongTerm === 0 ? false : data.ConditionGroupEraLongTerm || false);
            this.ConditionGroupEraMediumTerm = ko.observable(data.ConditionGroupEraMediumTerm === 0 ? false : data.ConditionGroupEraMediumTerm || false);
            this.ConditionGroupEraShortTerm = ko.observable(data.ConditionGroupEraShortTerm === 0 ? false : data.ConditionGroupEraShortTerm || false);
            this.ConditionGroupEraOverlapping = ko.observable(data.ConditionGroupEraOverlapping === 0 ? false : data.ConditionGroupEraOverlapping || false);
            this.ConditionGroupEraStartLongTerm = ko.observable(data.ConditionGroupEraStartLongTerm === 0 ? false : data.ConditionGroupEraStartLongTerm || false);
            this.ConditionGroupEraStartMediumTerm = ko.observable(data.ConditionGroupEraStartMediumTerm === 0 ? false : data.ConditionGroupEraStartMediumTerm || false);
            this.ConditionGroupEraStartShortTerm = ko.observable(data.ConditionGroupEraStartShortTerm === 0 ? false : data.ConditionGroupEraStartShortTerm || false);
            this.DrugExposureAnyTimePrior = ko.observable(data.DrugExposureAnyTimePrior === 0 ? false : data.DrugExposureAnyTimePrior || false);
            this.DrugExposureLongTerm = ko.observable(data.DrugExposureLongTerm === 0 ? false : data.DrugExposureLongTerm || false);
            this.DrugExposureMediumTerm = ko.observable(data.DrugExposureMediumTerm === 0 ? false : data.DrugExposureMediumTerm || false);
            this.DrugExposureShortTerm = ko.observable(data.DrugExposureShortTerm === 0 ? false : data.DrugExposureShortTerm || false);
            this.DrugEraAnyTimePrior = ko.observable(data.DrugEraAnyTimePrior === 0 ? false : data.DrugEraAnyTimePrior || false);
            this.DrugEraLongTerm = ko.observable(data.DrugEraLongTerm === 0 ? false : data.DrugEraLongTerm || false);
            this.DrugEraMediumTerm = ko.observable(data.DrugEraMediumTerm === 0 ? false : data.DrugEraMediumTerm || false);
            this.DrugEraShortTerm = ko.observable(data.DrugEraShortTerm === 0 ? false : data.DrugEraShortTerm || false);
            this.DrugEraOverlapping = ko.observable(data.DrugEraOverlapping === 0 ? false : data.DrugEraOverlapping || false);
            this.DrugEraStartLongTerm = ko.observable(data.DrugEraStartLongTerm === 0 ? false : data.DrugEraStartLongTerm || false);
            this.DrugEraStartMediumTerm = ko.observable(data.DrugEraStartMediumTerm === 0 ? false : data.DrugEraStartMediumTerm || false);
            this.DrugEraStartShortTerm = ko.observable(data.DrugEraStartShortTerm === 0 ? false : data.DrugEraStartShortTerm || false);
            this.DrugGroupEraAnyTimePrior = ko.observable(data.DrugGroupEraAnyTimePrior === 0 ? false : data.DrugGroupEraAnyTimePrior || false);
            this.DrugGroupEraLongTerm = ko.observable(data.DrugGroupEraLongTerm === 0 ? false : data.DrugGroupEraLongTerm || false);
            this.DrugGroupEraMediumTerm = ko.observable(data.DrugGroupEraMediumTerm === 0 ? false : data.DrugGroupEraMediumTerm || false);
            this.DrugGroupEraShortTerm = ko.observable(data.DrugGroupEraShortTerm === 0 ? false : data.DrugGroupEraShortTerm || false);
            this.DrugGroupEraOverlapping = ko.observable(data.DrugGroupEraOverlapping === 0 ? false : data.DrugGroupEraOverlapping || false);
            this.DrugGroupEraStartLongTerm = ko.observable(data.DrugGroupEraStartLongTerm === 0 ? false : data.DrugGroupEraStartLongTerm || false);
            this.DrugGroupEraStartMediumTerm = ko.observable(data.DrugGroupEraStartMediumTerm === 0 ? false : data.DrugGroupEraStartMediumTerm || false);
            this.DrugGroupEraStartShortTerm = ko.observable(data.DrugGroupEraStartShortTerm === 0 ? false : data.DrugGroupEraStartShortTerm || false);
            this.ProcedureOccurrenceAnyTimePrior = ko.observable(data.ProcedureOccurrenceAnyTimePrior === 0 ? false : data.ProcedureOccurrenceAnyTimePrior || false);
            this.ProcedureOccurrenceLongTerm = ko.observable(data.ProcedureOccurrenceLongTerm === 0 ? false : data.ProcedureOccurrenceLongTerm || false);
            this.ProcedureOccurrenceMediumTerm = ko.observable(data.ProcedureOccurrenceMediumTerm === 0 ? false : data.ProcedureOccurrenceMediumTerm || false);
            this.ProcedureOccurrenceShortTerm = ko.observable(data.ProcedureOccurrenceShortTerm === 0 ? false : data.ProcedureOccurrenceShortTerm || false);
            this.DeviceExposureAnyTimePrior = ko.observable(data.DeviceExposureAnyTimePrior === 0 ? false : data.DeviceExposureAnyTimePrior || false);
            this.DeviceExposureLongTerm = ko.observable(data.DeviceExposureLongTerm === 0 ? false : data.DeviceExposureLongTerm || false);
            this.DeviceExposureMediumTerm = ko.observable(data.DeviceExposureMediumTerm === 0 ? false : data.DeviceExposureMediumTerm || false);
            this.DeviceExposureShortTerm = ko.observable(data.DeviceExposureShortTerm === 0 ? false : data.DeviceExposureShortTerm || false);
            this.MeasurementAnyTimePrior = ko.observable(data.MeasurementAnyTimePrior === 0 ? false : data.MeasurementAnyTimePrior || false);
            this.MeasurementLongTerm = ko.observable(data.MeasurementLongTerm === 0 ? false : data.MeasurementLongTerm || false);
            this.MeasurementMediumTerm = ko.observable(data.MeasurementMediumTerm === 0 ? false : data.MeasurementMediumTerm || false);
            this.MeasurementShortTerm = ko.observable(data.MeasurementShortTerm === 0 ? false : data.MeasurementShortTerm || false);
            this.MeasurementValueAnyTimePrior = ko.observable(data.MeasurementValueAnyTimePrior === 0 ? false : data.MeasurementValueAnyTimePrior || false);
            this.MeasurementValueLongTerm = ko.observable(data.MeasurementValueLongTerm === 0 ? false : data.MeasurementValueLongTerm || false);
            this.MeasurementValueMediumTerm = ko.observable(data.MeasurementValueMediumTerm === 0 ? false : data.MeasurementValueMediumTerm || false);
            this.MeasurementValueShortTerm = ko.observable(data.MeasurementValueShortTerm === 0 ? false : data.MeasurementValueShortTerm || false);
            this.MeasurementRangeGroupAnyTimePrior = ko.observable(data.MeasurementRangeGroupAnyTimePrior === 0 ? false : data.MeasurementRangeGroupAnyTimePrior || false);
            this.MeasurementRangeGroupLongTerm = ko.observable(data.MeasurementRangeGroupLongTerm === 0 ? false : data.MeasurementRangeGroupLongTerm || false);
            this.MeasurementRangeGroupMediumTerm = ko.observable(data.MeasurementRangeGroupMediumTerm === 0 ? false : data.MeasurementRangeGroupMediumTerm || false);
            this.MeasurementRangeGroupShortTerm = ko.observable(data.MeasurementRangeGroupShortTerm === 0 ? false : data.MeasurementRangeGroupShortTerm || false);
            this.ObservationAnyTimePrior = ko.observable(data.ObservationAnyTimePrior === 0 ? false : data.ObservationAnyTimePrior || false);
            this.ObservationLongTerm = ko.observable(data.ObservationLongTerm === 0 ? false : data.ObservationLongTerm || false);
            this.ObservationMediumTerm = ko.observable(data.ObservationMediumTerm === 0 ? false : data.ObservationMediumTerm || false);
            this.ObservationShortTerm = ko.observable(data.ObservationShortTerm === 0 ? false : data.ObservationShortTerm || false);
            this.CharlsonIndex = ko.observable(data.CharlsonIndex === 0 ? false : data.CharlsonIndex || false);
            this.Dcsi = ko.observable(data.Dcsi === 0 ? false : data.Dcsi || false);
            this.Chads2 = ko.observable(data.Chads2 === 0 ? false : data.Chads2 || false);
            this.Chads2Vasc = ko.observable(data.Chads2Vasc === 0 ? false : data.Chads2Vasc || false);
            this.DistinctConditionCountLongTerm = ko.observable(data.DistinctConditionCountLongTerm === 0 ? false : data.DistinctConditionCountLongTerm || false);
            this.DistinctConditionCountMediumTerm = ko.observable(data.DistinctConditionCountMediumTerm === 0 ? false : data.DistinctConditionCountMediumTerm || false);
            this.DistinctConditionCountShortTerm = ko.observable(data.DistinctConditionCountShortTerm === 0 ? false : data.DistinctConditionCountShortTerm || false);
            this.DistinctIngredientCountLongTerm = ko.observable(data.DistinctIngredientCountLongTerm === 0 ? false : data.DistinctIngredientCountLongTerm || false);
            this.DistinctIngredientCountMediumTerm = ko.observable(data.DistinctIngredientCountMediumTerm === 0 ? false : data.DistinctIngredientCountMediumTerm || false);
            this.DistinctIngredientCountShortTerm = ko.observable(data.DistinctIngredientCountShortTerm === 0 ? false : data.DistinctIngredientCountShortTerm || false);
            this.DistinctProcedureCountLongTerm = ko.observable(data.DistinctProcedureCountLongTerm === 0 ? false : data.DistinctProcedureCountLongTerm || false);
            this.DistinctProcedureCountMediumTerm = ko.observable(data.DistinctProcedureCountMediumTerm === 0 ? false : data.DistinctProcedureCountMediumTerm || false);
            this.DistinctProcedureCountShortTerm = ko.observable(data.DistinctProcedureCountShortTerm === 0 ? false : data.DistinctProcedureCountShortTerm || false);
            this.DistinctMeasurementCountLongTerm = ko.observable(data.DistinctMeasurementCountLongTerm === 0 ? false : data.DistinctMeasurementCountLongTerm || false);
            this.DistinctMeasurementCountMediumTerm = ko.observable(data.DistinctMeasurementCountMediumTerm === 0 ? false : data.DistinctMeasurementCountMediumTerm || false);
            this.DistinctMeasurementCountShortTerm = ko.observable(data.DistinctMeasurementCountShortTerm === 0 ? false : data.DistinctMeasurementCountShortTerm || false);
            this.DistinctObservationCountLongTerm = ko.observable(data.DistinctObservationCountLongTerm === 0 ? false : data.DistinctObservationCountLongTerm || false);
            this.DistinctObservationCountMediumTerm = ko.observable(data.DistinctObservationCountMediumTerm === 0 ? false : data.DistinctObservationCountMediumTerm || false);
            this.DistinctObservationCountShortTerm = ko.observable(data.DistinctObservationCountShortTerm === 0 ? false : data.DistinctObservationCountShortTerm || false);
            this.VisitCountLongTerm = ko.observable(data.VisitCountLongTerm === 0 ? false : data.VisitCountLongTerm || false);
            this.VisitCountMediumTerm = ko.observable(data.VisitCountMediumTerm === 0 ? false : data.VisitCountMediumTerm || false);
            this.VisitCountShortTerm = ko.observable(data.VisitCountShortTerm === 0 ? false : data.VisitCountShortTerm || false);
            this.VisitConceptCountLongTerm = ko.observable(data.VisitConceptCountLongTerm === 0 ? false : data.VisitConceptCountLongTerm || false);
            this.VisitConceptCountMediumTerm = ko.observable(data.VisitConceptCountMediumTerm === 0 ? false : data.VisitConceptCountMediumTerm || false);
            this.VisitConceptCountShortTerm = ko.observable(data.VisitConceptCountShortTerm === 0 ? false : data.VisitConceptCountShortTerm || false);
            this.longTermStartDays = ko.observable(data.longTermStartDays || -365).extend({ numeric: 0});
            this.mediumTermStartDays = ko.observable(data.mediumTermStartDays || -180).extend({ numeric: 0});
            this.shortTermStartDays = ko.observable(data.shortTermStartDays || -30).extend({ numeric: 0});
            this.endDays = ko.observable(data.endDays || 0).extend({ numeric: 0});
            this.includedCovariateConceptIds = ko.observableArray((data.includedCovariateConceptIds && Array.isArray(data.includedCovariateConceptIds)) ? data.includedCovariateConceptIds : []);
            this.addDescendantsToInclude = ko.observable(data.addDescendantsToInclude === 0 ? false : data.addDescendantsToInclude  || false);
            this.excludedCovariateConceptIds = ko.observableArray((data.excludedCovariateConceptIds && Array.isArray(data.excludedCovariateConceptIds)) ? data.excludedCovariateConceptIds : []);
            this.addDescendantsToExclude = ko.observable(data.addDescendantsToExclude === 0 ? false : data.addDescendantsToExclude || false);
            this.includedCovariateIds = ko.observableArray((data.includedCovariateIds && Array.isArray(data.includedCovariateIds)) ? data.includedCovariateIds : []);
            this.attr_fun = data.attr_fun || "getDbDefaultCovariateData";
        }
    }
	
	return CovariateSettings;
});