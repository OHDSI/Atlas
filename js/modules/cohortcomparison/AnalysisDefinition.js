define(function (require, exports) {

	var $ = require('jquery');
	var ko = require('knockout');
	var ConceptSet = require('conceptsetbuilder/InputTypes/ConceptSet')

	function AnalysisDefinition(data, conceptSetList) {
		var self = this;
		var data = data || {};
		var conceptSetData;
		var selectedConceptSet;

		// Options
		self.modelTypeOptions = [
			{
				name: 'Logistic regression',
				cmArgValue: '"logistic"',
				rate: 'odds',
				id: 1
		}, {
				name: 'Poisson regression',
				cmArgValue: '"poisson"',
				rate: 'rate',
				id: 2
		}, {
				name: 'Cox proportional hazards',
				cmArgValue: '"cox"',
				rate: 'hazards',
				id: 3
		}];
		self.timeAtRiskEndOptions = [
			{
				name: 'cohort end date',
				id: 1
		}, {
				name: 'cohort start date',
				id: 0
		}];
		self.trimOptions = [
			{
				name: 'None',
				id: 0
		}, {
				name: 'by Percentile',
				id: 1
		}, {
				name: 'by Equipoise',
				id: 2
		}];
		self.matchingOptions = [
			{
				name: 'No matching/stratification',
				id: 0
		}, {
				name: 'Matching',
				id: 1
		}, {
				name: 'Stratification',
				id: 2
		}];

		self.id = data.id;
		self.description = ko.observable(data.description || null);
		self.timeAtRiskStart = ko.observable(data.timeAtRiskStart != null ? data.timeAtRiskStart : 0);
		self.timeAtRiskEnd = ko.observable(data.timeAtRiskEnd != null ? data.timeAtRiskEnd : 0);
		self.addExposureDaysToEnd = ko.observable(data.addExposureDaysToEnd != null ? data.addExposureDaysToEnd : 1);
		self.addExposureDaysToEndFormatted = ko.pureComputed(function () {
			return self.addExposureDaysToEnd() == 1;
		})
		self.minimumWashoutPeriod = ko.observable(data.minimumWashoutPeriod != null ? data.minimumWashoutPeriod : 0);
		self.minimumDaysAtRisk = ko.observable(data.minimumDaysAtRisk != null ? data.minimumDaysAtRisk : 0);
		self.rmSubjectsInBothCohorts = ko.observable(data.rmSubjectsInBothCohorts != null ? data.rmSubjectsInBothCohorts : 1);
		self.rmSubjectsInBothCohortsFormatted = ko.pureComputed(function () {
			return self.rmSubjectsInBothCohorts() == 1;
		});
		self.rmPriorOutcomes = ko.observable(data.rmPriorOutcomes != null ? data.rmPriorOutcomes : 1);
		self.rmPriorOutcomesFormatted = ko.pureComputed(function () {
			return self.rmPriorOutcomes() == 1;
		});

		self.omExclusionId = ko.observable(data.omExclusionId != null ? data.omExclusionId : 0);
		self.omExclusionCaption = ko.observable(null);
		self.omExclusionConceptSet = ko.observableArray(null);
		self.omExclusionConceptSetSQL = ko.observable(null);
		if (conceptSetList && conceptSetList.length > 0) {
			selectedConceptSet = $.grep(conceptSetList, function (f) {
				return f.id == data.omExclusionId;
			});
			if (selectedConceptSet.length > 0) {
				self.omExclusionCaption(selectedConceptSet[0].name);
				conceptSetData = {
					id: self.omExclusionId(),
					name: self.omExclusionCaption(),
					expression: selectedConceptSet[0].expression,
				};
				self.omExclusionConceptSet.push(new ConceptSet(conceptSetData));
				self.omExclusionConceptSetSQL(selectedConceptSet[0].sql);
			}
		}

		self.omInclusionId = ko.observable(data.omInclusionId != null ? data.omInclusionId : 0);
		self.omInclusionCaption = ko.observable(null);
		self.omInclusionConceptSet = ko.observableArray(null);
		self.omInclusionConceptSetSQL = ko.observable(null);
		if (conceptSetList && conceptSetList.length > 0) {
			selectedConceptSet = $.grep(conceptSetList, function (f) {
				return f.id == data.omInclusionId;
			});
			if (selectedConceptSet.length > 0) {
				self.omInclusionCaption(selectedConceptSet[0].name);
				conceptSetData = {
					id: self.omInclusionId(),
					name: self.omInclusionCaption(),
					expression: selectedConceptSet[0].expression,
				};
				self.omInclusionConceptSet.push(new ConceptSet(conceptSetData));
				self.omInclusionConceptSetSQL(selectedConceptSet[0].sql);
			}
		}

		self.negativeControlId = ko.observable(data.negativeControlId != null ? data.negativeControlId : 0);
		self.negativeControlCaption = ko.observable(null);
		self.negativeControlConceptSet = ko.observableArray(null);
		self.negativeControlConceptSetSQL = ko.observable(null);
		if (conceptSetList && conceptSetList.length > 0) {
			selectedConceptSet = $.grep(conceptSetList, function (f) {
				return f.id == data.negativeControlId;
			});
			if (selectedConceptSet.length > 0) {
				self.negativeControlCaption(selectedConceptSet[0].name);
				conceptSetData = {
					id: self.negativeControlId(),
					name: self.negativeControlCaption(),
					expression: selectedConceptSet[0].expression,
				};
				self.negativeControlConceptSet.push(new ConceptSet(conceptSetData));
				self.negativeControlConceptSetSQL(selectedConceptSet[0].sql);
			}
		}

		self.modelType = ko.observable(data.modelType != null ? data.modelType : null);
		self.delCovariatesSmallCount = ko.observable(data.delCovariatesSmallCount != null ? data.delCovariatesSmallCount : 100);

		// Derived fields
		self.modelTypeRate = function () {
			var returnVal = '';
			if (self.modelType() != null) {
				returnVal = self.modelTypeOptions.filter(function (item) {
					return item.id == self.modelType();
				})[0].rate
			}
			return returnVal;
		}

		self.modelTypeName = function () {
			var returnVal = '';
			if (self.modelType() != null) {
				returnVal = self.modelTypeOptions.filter(function (item) {
					return item.id == self.modelType();
				})[0].name
			}
			return returnVal;
		}

		self.modelTypeCmArgValue = function () {
			var returnVal = '';
			if (self.modelType() != null) {
				returnVal = self.modelTypeOptions.filter(function (item) {
					return item.id == self.modelType();
				})[0].cmArgValue
			}
			return returnVal;
		}

		self.addExposureDaysToEndDescription = function () {
			var returnVal = '';
			if (self.addExposureDaysToEnd() != null) {
				returnVal = self.timeAtRiskEndOptions.filter(function (item) {
					return item.id == self.addExposureDaysToEnd();
				})[0].name
			}
			return returnVal;
		}

		// Propensity Score Settings
		self.psAdjustment = ko.observable(data.psAdjustment != null ? data.psAdjustment : 1);

		self.psTrim = ko.observable(data.psTrim != null ? data.psTrim : 0);
		self.psTrimFraction = ko.observable(data.psTrimFraction != null ? data.psTrimFraction : 5);
		self.psTrimFractionFormatted = ko.pureComputed(function () {
			var trimFraction = self.psTrimFraction();
			if (trimFraction > 0) {
				trimFraction = trimFraction / 100;
			}
			if (self.psTrim() == 1) {
				return trimFraction;
			}
			if (self.psTrim() == 2) {
				return trimFraction + ", " + (1 - trimFraction);
			}
		});
		self.psMatch = ko.observable(data.psMatch != null ? data.psMatch : 1);
		self.psMatchMaxRatio = ko.observable(data.psMatchMaxRatio != null ? data.psMatchMaxRatio : 1);
		self.psStratNumStrata = ko.observable(data.psStratNumStrata != null ? data.psStratNumStrata : 5);

		self.psDemographicsGender = ko.observable((data.psDemographicsGender == 1) || false);
		self.psDemographicsRace = ko.observable((data.psDemographicsRace == 1) || false);
		self.psDemographicsEthnicity = ko.observable((data.psDemographicsEthnicity == 1) || false);
		self.psDemographicsAge = ko.observable((data.psDemographicsAge == 1) || false);
		self.psDemographicsYear = ko.observable((data.psDemographicsYear == 1) || false);
		self.psDemographicsMonth = ko.observable((data.psDemographicsMonth == 1) || false);

		self.psConditionOcc365d = ko.observable((data.psConditionOcc365d == 1) || false);
		self.psConditionOcc30d = ko.observable((data.psConditionOcc30d == 1) || false);
		self.psConditionOccInpt180d = ko.observable((data.psConditionOccInpt180d == 1) || false);

		self.psConditionEraEver = ko.observable((data.psConditionEraEver == 1) || false);
		self.psConditionEraOverlap = ko.observable((data.psConditionEraOverlap == 1) || false);
		self.psConditionGroupMeddra = ko.observable((data.psConditionGroupMeddra == 1) || false);
		self.psConditionGroupSnomed = ko.observable((data.psConditionGroupSnomed == 1) || false);

		self.psDrugExposure = ko.observable((data.psDrugExposure == 1) || false);
		self.psDrugInPrior30d = ko.observable((data.psDrugExposure30d == 1 || data.psDrugEra30d == 1) || false);
		self.psDrugInPrior365d = ko.observable((data.psDrugExposure365d == 1 || data.psDrugEra365d == 1) || false);

		self.psDrugEra = ko.observable((data.psDrugEra == 1) || false);
		self.psDrugEraOverlap = ko.observable((data.psDrugEraOverlap == 1) || false);
		self.psDrugEraEver = ko.observable((data.psDrugEraEver == 1) || false);
		self.psDrugGroup = ko.observable((data.psDrugGroup == 1) || false);

		self.psProcedureOcc365d = ko.observable((data.psProcedureOcc365d == 1) || false);
		self.psProcedureOcc30d = ko.observable((data.psProcedureOcc30d == 1) || false);
		self.psProcedureGroup = ko.observable((data.psProcedureGroup == 1) || false);

		self.psObservation = ko.observable((data.psObservation == 1) || false);
		self.psObservation365d = ko.observable((data.psObservation365d == 1) || false);
		self.psObservation30d = ko.observable((data.psObservation30d == 1) || false);
		self.psObservationCount365d = ko.observable((data.psObservationCount365d == 1) || false);

		self.psMeasurement365d = ko.observable((data.psMeasurement365d == 1) || false);
		self.psMeasurement30d = ko.observable((data.psMeasurement30d == 1) || false);
		self.psMeasurementCount365d = ko.observable((data.psMeasurementCount365d == 1) || false);
		self.psMeasurementBelow = ko.observable((data.psMeasurementBelow == 1) || false);
		self.psMeasurementAbove = ko.observable((data.psMeasurementAbove == 1) || false);

		self.psConceptCounts = ko.observable((data.psConceptCounts == 1) || false);

		self.psRiskScoresCharlson = ko.observable((data.psRiskScoresCharlson == 1) || false);
		self.psRiskScoresDcsi = ko.observable((data.psRiskScoresDcsi == 1) || false);
		self.psRiskScoresChads2 = ko.observable((data.psRiskScoresChads2 == 1) || false);
		self.psRiskScoresChads2vasc = ko.observable((data.psRiskScoresChads2vasc == 1) || false);

		self.psInteractionYear = ko.observable((data.psInteractionYear == 1) || false);
		self.psInteractionMonth = ko.observable((data.psInteractionMonth == 1) || false);

		// Propensity Score Settings - Derived
		self.psDemographics = ko.pureComputed(function () {
			return (self.psDemographicsGender() || self.psDemographicsRace() || self.psDemographicsEthnicity() || self.psDemographicsAge() || self.psDemographicsYear() || self.psDemographicsMonth());
		});
		self.psDemographicsIndeterminate = function () {
			var propCount = 0;
			propCount += self.psDemographicsGender() | 0;
			propCount += self.psDemographicsRace() | 0;
			propCount += self.psDemographicsEthnicity() | 0;
			propCount += self.psDemographicsAge() | 0;
			propCount += self.psDemographicsYear() | 0;
			propCount += self.psDemographicsMonth() | 0;
			return (propCount > 0 && propCount < 6);
		}
		self.psStrat = ko.pureComputed(function () {
			return self.psMatch() == 2;
		});
		self.psStratOrMatch = ko.pureComputed(function () {
			return self.psMatch() > 0;
		})
		self.psConditionOcc = ko.pureComputed(function () {
			return (self.psConditionOcc365d() || self.psConditionOcc30d() || self.psConditionOccInpt180d())
		});
		self.psConditionEra = ko.pureComputed(function () {
			return (self.psConditionEraEver() || self.psConditionEraOverlap())
		});
		self.psConditionGroup = ko.pureComputed(function () {
			return (self.psConditionGroupMeddra() || self.psConditionGroupSnomed())
		});
		self.psCondition = ko.pureComputed(function () {
			return (self.psConditionOcc() || self.psConditionEra())
		});
		self.psDrug = ko.pureComputed(function () {
			return (self.psDrugInPrior30d() || self.psDrugInPrior365d() || self.psDrugEraOverlap() || self.psDrugEraEver())
		});
		self.psDrugAggregation = ko.pureComputed(function () {
			return (self.psDrugExposure() || self.psDrugEra() || self.psDrugGroup())
		});
		self.psDrugExposure365d = ko.pureComputed(function () {
			return (self.psDrugExposure() && self.psDrugInPrior365d())
		});
		self.psDrugExposure30d = ko.pureComputed(function () {
			return (self.psDrugExposure() && self.psDrugInPrior30d())
		});
		self.psDrugEra365d = ko.pureComputed(function () {
			return (self.psDrugEra() && self.psDrugInPrior365d())
		});
		self.psDrugEra30d = ko.pureComputed(function () {
			return (self.psDrugEra() && self.psDrugInPrior30d())
		});
		self.psProcedureOcc = ko.pureComputed(function () {
			return (self.psProcedureOcc365d() || self.psProcedureOcc30d() || self.psProcedureGroup())
		})
		self.psMeasurement = ko.pureComputed(function () {
			return (self.psMeasurement365d() || self.psMeasurement30d() || self.psMeasurementCount365d() || self.psMeasurementBelow() || self.psMeasurementAbove())
		})
		self.psRiskScores = ko.pureComputed(function () {
			return (self.psRiskScoresCharlson() || self.psRiskScoresDcsi() || self.psRiskScoresChads2() || self.psRiskScoresChads2vasc())
		})
		self.psInteraction = ko.pureComputed(function () {
			return (self.psInteractionYear() || self.psInteractionMonth())
		})

		// Outcome model settings
		self.omCovariates = ko.observable(data.omCovariates != null ? data.omCovariates : 0);

		self.omTrim = ko.observable(data.omTrim != null ? data.omTrim : 0);
		self.omTrimFraction = ko.observable(data.omTrimFraction != null ? data.omTrimFraction : 5);
		self.omMatch = ko.observable(data.omMatch != null ? data.omMatch : 1);
		self.omMatchMaxRatio = ko.observable(data.omMatchMaxRatio != null ? data.omMatchMaxRatio : 1);
		self.omStratNumStrata = ko.observable(data.omStratNumStrata != null ? data.omStratNumStrata : 5);

		self.omDemographicsGender = ko.observable((data.omDemographicsGender == 1) || false);
		self.omDemographicsRace = ko.observable((data.omDemographicsRace == 1) || false);
		self.omDemographicsEthnicity = ko.observable((data.omDemographicsEthnicity == 1) || false);
		self.omDemographicsAge = ko.observable((data.omDemographicsAge == 1) || false);
		self.omDemographicsYear = ko.observable((data.omDemographicsYear == 1) || false);
		self.omDemographicsMonth = ko.observable((data.omDemographicsMonth == 1) || false);

		self.omConditionOcc365d = ko.observable((data.omConditionOcc365d == 1) || false);
		self.omConditionOcc30d = ko.observable((data.omConditionOcc30d == 1) || false);
		self.omConditionOccInpt180d = ko.observable((data.omConditionOccInpt180d == 1) || false);

		self.omConditionEraEver = ko.observable((data.omConditionEraEver == 1) || false);
		self.omConditionEraOverlap = ko.observable((data.omConditionEraOverlap == 1) || false);
		self.omConditionGroupMeddra = ko.observable((data.omConditionGroupMeddra == 1) || false);
		self.omConditionGroupSnomed = ko.observable((data.omConditionGroupSnomed == 1) || false);

		self.omDrugExposure = ko.observable((data.omDrugExposure == 1) || false);
		self.omDrugInPrior30d = ko.observable((data.omDrugExposure30d == 1 || data.omDrugEraExposure30d == 1) || false);
		self.omDrugInPrior365d = ko.observable((data.omDrugExposure365d == 1 || data.omDrugEraExposure365d == 1) || false);

		self.omDrugEra = ko.observable((data.omDrugEra == 1) || false);
		self.omDrugEraOverlap = ko.observable((data.omDrugEraOverlap == 1) || false);
		self.omDrugEraEver = ko.observable((data.omDrugEraEver == 1) || false);
		self.omDrugGroup = ko.observable((data.omDrugGroup == 1) || false);

		self.omProcedureOcc365d = ko.observable((data.omProcedureOcc365d == 1) || false);
		self.omProcedureOcc30d = ko.observable((data.omProcedureOcc30d == 1) || false);
		self.omProcedureGroup = ko.observable((data.omProcedureGroup == 1) || false);

		self.omObservation = ko.observable((data.omObservation == 1) || false);
		self.omObservation365d = ko.observable((data.omObservation365d == 1) || false);
		self.omObservation30d = ko.observable((data.omObservation30d == 1) || false);
		self.omObservationCount365d = ko.observable((data.omObservationCount365d == 1) || false);

		self.omMeasurement365d = ko.observable((data.omMeasurement365d == 1) || false);
		self.omMeasurement30d = ko.observable((data.omMeasurement30d == 1) || false);
		self.omMeasurementCount365d = ko.observable((data.omMeasurementCount365d == 1) || false);
		self.omMeasurementBelow = ko.observable((data.omMeasurementBelow == 1) || false);
		self.omMeasurementAbove = ko.observable((data.omMeasurementAbove == 1) || false);

		self.omConceptCounts = ko.observable((data.omConceptCounts == 1) || false);

		self.omRiskScoresCharlson = ko.observable((data.omRiskScoresCharlson == 1) || false);
		self.omRiskScoresDcsi = ko.observable((data.omRiskScoresDcsi == 1) || false);
		self.omRiskScoresChads2 = ko.observable((data.omRiskScoresChads2 == 1) || false);
		self.omRiskScoresChads2vasc = ko.observable((data.omRiskScoresChads2vasc == 1) || false);

		self.omInteractionYear = ko.observable((data.omInteractionYear == 1) || false);
		self.omInteractionMonth = ko.observable((data.omInteractionMonth == 1) || false);

		// Outcome Model Settings - Derived
		self.omDemographics = ko.pureComputed(function () {
			return (self.omDemographicsGender() || self.omDemographicsRace() || self.omDemographicsEthnicity() || self.omDemographicsAge() || self.omDemographicsYear() || self.omDemographicsMonth());
		});
		self.omDemographicsIndeterminate = function () {
			var propCount = 0;
			propCount += self.omDemographicsGender() | 0;
			propCount += self.omDemographicsRace() | 0;
			propCount += self.omDemographicsEthnicity() | 0;
			propCount += self.omDemographicsAge() | 0;
			propCount += self.omDemographicsYear() | 0;
			propCount += self.omDemographicsMonth() | 0;
			return (propCount > 0 && propCount < 6);
		}
		self.omStrat = ko.pureComputed(function () {
			return !self.omMatch();
		});
		self.omConditionOcc = ko.pureComputed(function () {
			return (self.omConditionOcc365d() || self.omConditionOcc30d() || self.omConditionOccInpt180d())
		});
		self.omConditionEra = ko.pureComputed(function () {
			return (self.omConditionEraEver() || self.omConditionEraOverlap())
		});
		self.omConditionGroup = ko.pureComputed(function () {
			return (self.omConditionGroupMeddra() || self.omConditionGroupSnomed())
		});
		self.omCondition = ko.pureComputed(function () {
			return (self.omConditionOcc() || self.omConditionEra())
		});
		self.omDrug = ko.pureComputed(function () {
			return (self.omDrugInPrior30d() || self.omDrugInPrior365d() || self.omDrugEraOverlap() || self.omDrugEraEver())
		});
		self.omDrugAggregation = ko.pureComputed(function () {
			return (self.omDrugExposure() || self.omDrugEra() || self.omDrugGroup())
		});
		self.omDrugExposure365d = ko.pureComputed(function () {
			return (self.omDrugExposure() && self.omDrugInPrior365d())
		});
		self.omDrugExposure30d = ko.pureComputed(function () {
			return (self.omDrugExposure() && self.omDrugInPrior30d())
		});
		self.omDrugEra365d = ko.pureComputed(function () {
			return (self.omDrugEra() && self.omDrugInPrior365d())
		});
		self.omDrugEra30d = ko.pureComputed(function () {
			return (self.omDrugEra() && self.omDrugInPrior30d())
		});
		self.omProcedureOcc = ko.pureComputed(function () {
			return (self.omProcedureOcc365d() || self.omProcedureOcc30d() || self.omProcedureGroup())
		});
		self.omMeasurement = ko.pureComputed(function () {
			return (self.omMeasurement365d() || self.omMeasurement30d() || self.omMeasurementCount365d() || self.omMeasurementBelow() || self.omMeasurementAbove())
		});
		self.omRiskScores = ko.pureComputed(function () {
			return (self.omRiskScoresCharlson() || self.omRiskScoresDcsi() || self.omRiskScoresChads2() || self.omRiskScoresChads2vasc())
		});
		self.omInteraction = ko.pureComputed(function () {
			return (self.omInteractionYear() || self.omInteractionMonth())
		});

		self.jsonify = function () {
			return {
				id: self.id || null,
				description: self.description(),
				modelType: self.modelType(),
				timeAtRiskStart: self.timeAtRiskStart(),
				timeAtRiskEnd: self.timeAtRiskEnd(),
				addExposureDaysToEnd: self.addExposureDaysToEnd(),
				minimumWashoutPeriod: self.minimumWashoutPeriod(),
				minimumDaysAtRisk: self.minimumDaysAtRisk(),
				rmSubjectsInBothCohorts: self.rmSubjectsInBothCohorts(),
				rmPriorOutcomes: self.rmPriorOutcomes(),
				psAdjustment: self.psAdjustment(),
				psDemographics: self.psDemographics() | 0,
				psDemographicsGender: self.psDemographicsGender() | 0,
				psDemographicsRace: self.psDemographicsRace() | 0,
				psDemographicsEthnicity: self.psDemographicsEthnicity() | 0,
				psDemographicsAge: self.psDemographicsAge() | 0,
				psDemographicsYear: self.psDemographicsYear() | 0,
				psDemographicsMonth: self.psDemographicsMonth() | 0,
				psTrim: self.psTrim(),
				psTrimFraction: self.psTrimFraction(),
				psMatch: self.psMatch(),
				psMatchMaxRatio: self.psMatchMaxRatio(),
				psStrat: self.psStrat() | 0,
				psStratNumStrata: self.psStratNumStrata(),
				psConditionOcc: self.psConditionOcc() | 0,
				psConditionOcc365d: self.psConditionOcc365d() | 0,
				psConditionOcc30d: self.psConditionOcc30d() | 0,
				psConditionOccInpt180d: self.psConditionOccInpt180d() | 0,
				psConditionEra: self.psConditionEra() | 0,
				psConditionEraEver: self.psConditionEraEver() | 0,
				psConditionEraOverlap: self.psConditionEraOverlap() | 0,
				psConditionGroup: self.psConditionGroup() | 0,
				psConditionGroupMeddra: self.psConditionGroupMeddra() | 0,
				psConditionGroupSnomed: self.psConditionGroupSnomed() | 0,
				psDrugExposure: self.psDrugExposure() | 0,
				psDrugExposure365d: self.psDrugExposure365d() | 0,
				psDrugExposure30d: self.psDrugExposure30d() | 0,
				psDrugEra: self.psDrugEra() | 0,
				psDrugEra365d: self.psDrugEra365d() | 0,
				psDrugEra30d: self.psDrugEra30d() | 0,
				psDrugEraOverlap: self.psDrugEraOverlap() | 0,
				psDrugEraEver: self.psDrugEraEver() | 0,
				psDrugGroup: self.psDrugGroup() | 0,
				psProcedureOcc: self.psProcedureOcc() | 0,
				psProcedureOcc365d: self.psProcedureOcc365d() | 0,
				psProcedureOcc30d: self.psProcedureOcc30d() | 0,
				psProcedureGroup: self.psProcedureGroup() | 0,
				psObservation: self.psObservation() | 0,
				psObservation365d: self.psObservation365d() | 0,
				psObservation30d: self.psObservation30d() | 0,
				psObservationCount365d: self.psObservationCount365d() | 0,
				psMeasurement: self.psMeasurement() | 0,
				psMeasurement365d: self.psMeasurement365d() | 0,
				psMeasurement30d: self.psMeasurement30d() | 0,
				psMeasurementCount365d: self.psMeasurementCount365d() | 0,
				psMeasurementBelow: self.psMeasurementBelow() | 0,
				psMeasurementAbove: self.psMeasurementAbove() | 0,
				psConceptCounts: self.psConceptCounts() | 0,
				psRiskScores: self.psRiskScores() | 0,
				psRiskScoresCharlson: self.psRiskScoresCharlson() | 0,
				psRiskScoresDcsi: self.psRiskScoresDcsi() | 0,
				psRiskScoresChads2: self.psRiskScoresChads2() | 0,
				psRiskScoresChads2vasc: self.psRiskScoresChads2vasc() | 0,
				psInteractionYear: self.psInteractionYear() | 0,
				psInteractionMonth: self.psInteractionMonth() | 0,
				omCovariates: self.omCovariates(),
				omExclusionId: self.omExclusionId(),
				omInclusionId: self.omInclusionId(),
				omDemographics: self.omDemographics() | 0,
				omDemographicsGender: self.omDemographicsGender() | 0,
				omDemographicsRace: self.omDemographicsRace() | 0,
				omDemographicsEthnicity: self.omDemographicsEthnicity() | 0,
				omDemographicsAge: self.omDemographicsAge() | 0,
				omDemographicsYear: self.omDemographicsYear() | 0,
				omDemographicsMonth: self.omDemographicsMonth() | 0,
				omTrim: self.omTrim(),
				omTrimFraction: self.omTrimFraction(),
				omMatch: self.omMatch(),
				omMatchMaxRatio: self.omMatchMaxRatio(),
				omStrat: self.omStrat() | 0,
				omStratNumStrata: self.omStratNumStrata(),
				omConditionOcc: self.omConditionOcc() | 0,
				omConditionOcc365d: self.omConditionOcc365d() | 0,
				omConditionOcc30d: self.omConditionOcc30d() | 0,
				omConditionOccInpt180d: self.omConditionOccInpt180d() | 0,
				omConditionEra: self.omConditionEra() | 0,
				omConditionEraEver: self.omConditionEraEver() | 0,
				omConditionEraOverlap: self.omConditionEraOverlap() | 0,
				omConditionGroup: self.omConditionGroup() | 0,
				omConditionGroupMeddra: self.omConditionGroupMeddra() | 0,
				omConditionGroupSnomed: self.omConditionGroupSnomed() | 0,
				omDrugExposure: self.omDrugExposure() | 0,
				omDrugExposure365d: self.omDrugExposure365d() | 0,
				omDrugExposure30d: self.omDrugExposure30d() | 0,
				omDrugEra: self.omDrugEra() | 0,
				omDrugEra365d: self.omDrugEra365d() | 0,
				omDrugEra30d: self.omDrugEra30d() | 0,
				omDrugEraOverlap: self.omDrugEraOverlap() | 0,
				omDrugEraEver: self.omDrugEraEver() | 0,
				omDrugGroup: self.omDrugGroup() | 0,
				omProcedureOcc: self.omProcedureOcc() | 0,
				omProcedureOcc365d: self.omProcedureOcc365d() | 0,
				omProcedureOcc30d: self.omProcedureOcc30d() | 0,
				omProcedureGroup: self.omProcedureGroup() | 0,
				omObservation: self.omObservation() | 0,
				omObservation365d: self.omObservation365d() | 0,
				omObservation30d: self.omObservation30d() | 0,
				omObservationCount365d: self.omObservationCount365d() | 0,
				omMeasurement: self.omMeasurement() | 0,
				omMeasurement365d: self.omMeasurement365d() | 0,
				omMeasurement30d: self.omMeasurement30d() | 0,
				omMeasurementCount365d: self.omMeasurementCount365d() | 0,
				omMeasurementBelow: self.omMeasurementBelow() | 0,
				omMeasurementAbove: self.omMeasurementAbove() | 0,
				omConceptCounts: self.omConceptCounts() | 0,
				omRiskScores: self.omRiskScores() | 0,
				omRiskScoresCharlson: self.omRiskScoresCharlson() | 0,
				omRiskScoresDcsi: self.omRiskScoresDcsi() | 0,
				omRiskScoresChads2: self.omRiskScoresChads2() | 0,
				omRiskScoresChads2vasc: self.omRiskScoresChads2vasc() | 0,
				omInteractionYear: self.omInteractionYear() | 0,
				omInteractionMonth: self.omInteractionMonth() | 0,
				delCovariatesSmallCount: self.delCovariatesSmallCount(),
				negativeControlId: self.negativeControlId()
			};
		}

	}

	return AnalysisDefinition;
});
