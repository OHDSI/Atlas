define(function (require, exports) {

	var ko = require('knockout');
    var CohortDefinition = require('cohortbuilder/CohortDefinition')
    var ConceptSet = require('conceptsetbuilder/InputTypes/ConceptSet')

	function ComparativeCohortAnalysis(data) {
		var self = this;
		var data = data || {};

        // Options
        self.modelTypeOptions = [{name: 'Logistic regression', cmArgValue: '"logistic"', rate: 'odds', id: 1}, {name: 'Poisson regression', cmArgValue: '"poisson"', rate: 'rate', id: 2}, {name: 'Cox proportional hazards', cmArgValue: '"cox"', rate: 'hazards', id: 3}];
        self.timeAtRiskEndOptions = [{name: 'cohort end date', id: 1}, {name: 'cohort start date', id: 0}];
        self.trimOptions = [{name: 'None', id: 0}, {name: 'by Percentile', id: 1}, {name: 'to Equipoise', id: 2}];
        self.matchingOptions = [{name: 'No matching/stratification', id: 0}, {name: 'Matching', id: 1}, {name: 'Stratification', id: 2}];

        // Properties
		self.analysisId = data.analysisId || null;
		self.name = ko.observable(data.name || null);
        self.nameMultiLine = ko.pureComputed(function() {
            var maxLength = 45;
            var nameFormatted = [];
            if (self.name() && self.name().length > 0) {
				var nameSplit = self.name().split(" ");
				var curName = "";
				for(i=0; i < nameSplit.length; i++) {
					if (curName.length > maxLength) {
						nameFormatted.push(curName);
						curName = "";
					}
					curName += nameSplit[i] + " ";
				}
				nameFormatted.push(curName);            	
            }
            return nameFormatted;
        })
        self.timeAtRiskStart = ko.observable(data.timeAtRiskStart != null ? data.timeAtRiskStart : 0);
        self.timeAtRiskEnd = ko.observable(data.timeAtRiskEnd != null ? data.timeAtRiskEnd : 0);
        self.addExposureDaysToEnd = ko.observable(data.addExposureDaysToEnd != null ? data.addExposureDaysToEnd : 1);
        self.addExposureDaysToEndFormatted = ko.pureComputed(function() {
            return self.addExposureDaysToEnd() == 1;
        })
        self.minimumWashoutPeriod = ko.observable(data.minimumWashoutPeriod != null ? data.minimumWashoutPeriod : 0);
        self.minimumDaysAtRisk = ko.observable(data.minimumDaysAtRisk != null ? data.minimumDaysAtRisk : 0);
        self.rmSubjectsInBothCohorts = ko.observable(data.rmSubjectsInBothCohorts != null ? data.rmSubjectsInBothCohorts : 1);
        self.rmSubjectsInBothCohortsFormatted = ko.pureComputed(function() {
            return self.rmSubjectsInBothCohorts() == 1;
        });
        self.rmPriorOutcomes = ko.observable(data.rmPriorOutcomes != null ? data.rmPriorOutcomes : 1);
        self.rmPriorOutcomesFormatted = ko.pureComputed(function () {
            return self.rmPriorOutcomes() == 1;
        });

		self.treatmentId = ko.observable(data.treatmentId != null ? data.treatmentId : 0);
		self.treatmentCaption = ko.observable(data.treatmentCaption != null ? data.treatmentCaption : null);
        if (data.treatmentCohortDefinition != null) {
			jsonCohortDefinition = JSON.parse(data.treatmentCohortDefinition);
			self.treatmentCohortDefinition = ko.observable(new CohortDefinition(jsonCohortDefinition));
        } else {        	
        	self.treatmentCohortDefinition = ko.observable(null);
        }

		self.comparatorId = ko.observable(data.comparatorId != null ? data.comparatorId : 0);
        self.comparatorCaption = ko.observable(data.comparatorCaption != null ?  data.comparatorCaption : null);
        if (data.comparatorCohortDefinition != null) {
			jsonCohortDefinition = JSON.parse(data.comparatorCohortDefinition);
			self.comparatorCohortDefinition = ko.observable(new CohortDefinition(jsonCohortDefinition));
        } else {        	
        	self.comparatorCohortDefinition = ko.observable(null);
        }
        
		self.outcomeId = ko.observable(data.outcomeId != null ? data.outcomeId : 0);
		self.outcomeCaption = ko.observable(data.outcomeCaption != null ? data.outcomeCaption : null);
        if (data.outcomeCohortDefinition != null) {
			jsonCohortDefinition = JSON.parse(data.outcomeCohortDefinition);
			self.outcomeCohortDefinition = ko.observable(new CohortDefinition(jsonCohortDefinition));
        } else {        	
        	self.outcomeCohortDefinition = ko.observable(null);
        }

        self.psExclusionId = ko.observable(data.psExclusionId != null ? data.psExclusionId : 0);
        self.psExclusionCaption = ko.observable(data.psExclusionCaption != null ? data.psExclusionCaption : null);
		self.psExclusionConceptSet = ko.observableArray(null);
        if (self.psExclusionId() > 0) {
            var conceptSetData = {
                                    id: self.psExclusionId(),
                                    name: self.psExclusionCaption(),
                                    expression: data.psExclusionConceptSet
                                 };
            self.psExclusionConceptSet.push(new ConceptSet(conceptSetData));
            self.psExclusionConceptSetSQL = ko.observable(data.psExclusionConceptSetSql)
        } else {
            self.psExclusionConceptSetSQL = ko.observable(null);            
        }
        
        self.psInclusionId = ko.observable(data.psInclusionId != null ? data.psInclusionId : 0);
        self.psInclusionCaption = ko.observable(data.psInclusionCaption != null ? data.psInclusionCaption : null);
        self.psInclusionConceptSet = ko.observableArray(null);
        if (self.psInclusionId() > 0) {
            var conceptSetData = {
                                    id: self.psInclusionId(),
                                    name: self.psInclusionCaption(),
                                    expression: data.psInclusionConceptSet
                                 };
            self.psInclusionConceptSet.push(new ConceptSet(conceptSetData));
            self.psInclusionConceptSetSQL = ko.observable(data.psInclusionConceptSetSql)
        } else {
            self.psInclusionConceptSetSQL = ko.observable(null);
        }

        self.omExclusionId = ko.observable(data.omExclusionId != null ? data.omExclusionId : 0);
        self.omExclusionCaption = ko.observable(data.omExclusionCaption != null ? data.omExclusionCaption : null);
        self.omExclusionConceptSet = ko.observableArray(null);
        if (self.omExclusionId() > 0) {
            var conceptSetData = {
                                    id: self.omExclusionId(),
                                    name: self.omExclusionCaption(),
                                    expression: data.omExclusionConceptSet
                                 };
            self.omExclusionConceptSet.push(new ConceptSet(conceptSetData));
            self.omExclusionConceptSetSQL = ko.observable(data.omExclusionConceptSetSql)
        } else {
            self.omExclusionConceptSetSQL = ko.observable(null);
        }
        
        self.omInclusionId = ko.observable(data.omInclusionId != null ? data.omInclusionId : 0);
        self.omInclusionCaption = ko.observable(data.omInclusionCaption != null ? data.omInclusionCaption : null);
        self.omInclusionConceptSet = ko.observableArray(null);
        if (self.omInclusionId() > 0) {
            var conceptSetData = {
                                    id: self.omInclusionId(),
                                    name: self.omInclusionCaption(),
                                    expression: data.omInclusionConceptSet
                                 };
            self.omInclusionConceptSet.push(new ConceptSet(conceptSetData));
            self.omInclusionConceptSetSQL = ko.observable(data.omInclusionConceptSetSql)
        } else {
            self.omInclusionConceptSetSQL = ko.observable(null);
        }

        self.negativeControlId = ko.observable(data.negativeControlId != null ? data.negativeControlId : 0);
		self.negativeControlCaption = ko.observable(data.negativeControlCaption != null ? data.negativeControlCaption : null);
        self.negativeControlConceptSet = ko.observableArray(null);
        if (self.negativeControlId() > 0) {
            var conceptSetData = {
                                    id: self.negativeControlId(),
                                    name: self.negativeControlCaption(),
                                    expression: data.negativeControlConceptSet
                                 };
            self.negativeControlConceptSet.push(new ConceptSet(conceptSetData));
            self.negativeControlConceptSetSQL = ko.observable(data.negativeControlConceptSetSql)
        } else {
            self.negativeControlConceptSetSQL = ko.observable(null);
        }
        
        self.modelType = ko.observable(data.modelType != null ? data.modelType : null);
        self.delCovariatesSmallCount = ko.observable(data.delCovariatesSmallCount != null ? data.delCovariatesSmallCount : 100);
        
        // Derived fields
        self.modelTypeRate = function() {
            returnVal = '';
            if(self.modelType() != null) {
                returnVal = self.modelTypeOptions.filter(function(item) {
                		return item.id == self.modelType(); 
                	})[0].rate
            }
            return returnVal;
        }
        
        self.modelTypeName = function() {
            returnVal = '';
            if(self.modelType() != null) {
                returnVal = self.modelTypeOptions.filter(function(item) {
                		return item.id == self.modelType(); 
                	})[0].name
            }
            return returnVal;
        }

        self.modelTypeCmArgValue = function() {
            returnVal = '';
            if(self.modelType() != null) {
                returnVal = self.modelTypeOptions.filter(function(item) {
                		return item.id == self.modelType(); 
                	})[0].cmArgValue
            }
            return returnVal;
        }
        
        self.addExposureDaysToEndDescription = function() {
            returnVal = '';
            if(self.addExposureDaysToEnd() != null) {
                returnVal = self.timeAtRiskEndOptions.filter(function(item) {
                		return item.id == self.addExposureDaysToEnd(); 
                	})[0].name
            }
            return returnVal;
        }
        
        self.readyForDisplay = function() {
            return (self.comparatorId() != null && self.comparatorId() > 0 &&
                    self.treatmentId() != null && self.treatmentId() > 0 &&
                    self.outcomeId() != null && self.outcomeId() > 0 &&
                    self.modelType() != null)
        }

        
        // Propensity Score Settings
        self.psAdjustment = ko.observable(data.psAdjustment != null ? data.psAdjustment : 1);
        
        self.psTrim = ko.observable(data.psTrim != null ? data.psTrim : 0);
        self.psTrimFraction = ko.observable(data.psTrimFraction != null ? data.psTrimFraction : 5);
        self.psTrimFractionFormatted = ko.pureComputed(function() {
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
        self.psTrimDescription = ko.pureComputed(function() {
            if (self.psTrim() == 1) {
              return "Trim Fraction (1-100%):";
            }
            if (self.psTrim() == 2) {
              return "Bounds (1-100%):";
            }
        });
        self.psMatch = ko.observable(data.psMatch != null ? data.psMatch : 1);
        self.psMatchMaxRatio = ko.observable(data.psMatchMaxRatio != null ? data.psMatchMaxRatio : 1);
        self.psStratNumStrata = ko.observable(data.psStratNumStrata != null ? data.psStratNumStrata : 5);

        self.psDemographicsGender = ko.observable((data.psDemographicsGender == 1)|| false);
        self.psDemographicsRace = ko.observable((data.psDemographicsRace == 1)||false);
        self.psDemographicsEthnicity = ko.observable((data.psDemographicsEthnicity == 1)||false);
        self.psDemographicsAge = ko.observable((data.psDemographicsAge == 1)||false);
        self.psDemographicsYear = ko.observable((data.psDemographicsYear == 1)||false);
        self.psDemographicsMonth = ko.observable((data.psDemographicsMonth == 1)||false);
        
        self.psConditionOcc365d = ko.observable((data.psConditionOcc365d == 1)||false);
        self.psConditionOcc30d = ko.observable((data.psConditionOcc30d == 1)||false);
        self.psConditionOccInpt180d = ko.observable((data.psConditionOccInpt180d == 1)||false);

        self.psConditionEraEver = ko.observable((data.psConditionEraEver == 1)||false);
        self.psConditionEraOverlap = ko.observable((data.psConditionEraOverlap == 1)||false);
        self.psConditionGroupMeddra = ko.observable((data.psConditionGroupMeddra == 1)||false);
        self.psConditionGroupSnomed = ko.observable((data.psConditionGroupSnomed == 1)||false);        
        
        //self.psDrugExposure = ko.observable((data.psDrugExposure == 1)||false);
        self.psDrugInPrior30d = ko.observable((data.psDrugExposure30d == 1 || data.psDrugEra30d == 1) || false); 
        self.psDrugInPrior365d = ko.observable((data.psDrugExposure365d == 1 || data.psDrugEra365d == 1) || false);
        
        self.psDrugEra = ko.observable((data.psDrugEra == 1)||false);
        self.psDrugEraOverlap = ko.observable((data.psDrugEraOverlap == 1)||false);
        self.psDrugEraEver = ko.observable((data.psDrugEraEver == 1)||false);
        self.psDrugGroup = ko.observable((data.psDrugGroup == 1)||false);
        
        self.psProcedureOcc365d = ko.observable((data.psProcedureOcc365d == 1)||false);
        self.psProcedureOcc30d = ko.observable((data.psProcedureOcc30d == 1)||false);
        self.psProcedureGroup = ko.observable((data.psProcedureGroup == 1)||false);
        
        self.psObservation = ko.observable((data.psObservation == 1)||false);
        self.psObservation365d = ko.observable((data.psObservation365d == 1)||false);
        self.psObservation30d = ko.observable((data.psObservation30d == 1)||false);
        self.psObservationCount365d = ko.observable((data.psObservationCount365d == 1)||false);
        
        self.psMeasurement365d = ko.observable((data.psMeasurement365d == 1)||false);
        self.psMeasurement30d = ko.observable((data.psMeasurement30d == 1)||false);
        self.psMeasurementCount365d = ko.observable((data.psMeasurementCount365d == 1)||false);
        self.psMeasurementBelow = ko.observable((data.psMeasurementBelow == 1)||false);
        self.psMeasurementAbove = ko.observable((data.psMeasurementAbove == 1)||false);
        
        self.psConceptCounts = ko.observable((data.psConceptCounts == 1)||false);

        self.psRiskScoresCharlson = ko.observable((data.psRiskScoresCharlson == 1)||false);
        self.psRiskScoresDcsi = ko.observable((data.psRiskScoresDcsi == 1)||false);
        self.psRiskScoresChads2 = ko.observable((data.psRiskScoresChads2 == 1)||false);
        self.psRiskScoresChads2vasc = ko.observable((data.psRiskScoresChads2vasc == 1)||false);
        
        self.psInteractionYear = ko.observable((data.psInteractionYear == 1)||false);
        self.psInteractionMonth = ko.observable((data.psInteractionMonth == 1)||false);

        // Propensity Score Settings - Derived
        self.psDemographics = ko.pureComputed(function () {
			return (self.psDemographicsGender() || self.psDemographicsRace() || self.psDemographicsEthnicity() || self.psDemographicsAge() || self.psDemographicsYear() || self.psDemographicsMonth());
		});
        self.psDemographicsIndeterminate = function() {
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
        self.psStratOrMatch = ko.pureComputed(function() {
            return self.psMatch() > 0;
        })
        self.psConditionOcc = ko.pureComputed(function() {
            return (self.psConditionOcc365d() || self.psConditionOcc30d() || self.psConditionOccInpt180d())
        });
        self.psConditionEra = ko.pureComputed(function() {
            return (self.psConditionEraEver() || self.psConditionEraOverlap())
        });
        self.psConditionGroup = ko.pureComputed(function() {
            return (self.psConditionGroupMeddra() || self.psConditionGroupSnomed())
        });
        self.psCondition = ko.pureComputed(function() {
            return (self.psConditionOcc() || self.psConditionEra())
        });
        self.psDrug = ko.pureComputed(function() {
            return (self.psDrugInPrior30d() || self.psDrugInPrior365d() || self.psDrugEraOverlap() || self.psDrugEraEver())
        });
        self.psDrugExposure = ko.pureComputed(function() {
        	return (self.psDrugInPrior30d() || self.psDrugInPrior365d())
        });
        self.psDrugAggregation = ko.pureComputed(function() {
            return (self.psDrugEra() || self.psDrugGroup())
        });
        self.psDrugExposure365d = ko.pureComputed(function() {
            return self.psDrugInPrior365d()
        });
        self.psDrugExposure30d = ko.pureComputed(function() {
            return self.psDrugInPrior30d()
        });
        self.psDrugEra365d = ko.pureComputed(function() {
            return (self.psDrugEra() && self.psDrugInPrior365d())
        });
        self.psDrugEra30d = ko.pureComputed(function() {
            return (self.psDrugEra() && self.psDrugInPrior30d())
        });
        self.psProcedureOcc = ko.pureComputed(function() {
            return (self.psProcedureOcc365d() || self.psProcedureOcc30d() || self.psProcedureGroup())
        })
        self.psMeasurement = ko.pureComputed(function() {
            return (self.psMeasurement365d() || self.psMeasurement30d() || self.psMeasurementCount365d() || self.psMeasurementBelow() || self.psMeasurementAbove())
        })
        self.psRiskScores = ko.pureComputed(function() {
            return (self.psRiskScoresCharlson() || self.psRiskScoresDcsi() || self.psRiskScoresChads2() || self.psRiskScoresChads2vasc())
        })
        self.psInteraction = ko.pureComputed(function() {
            return (self.psInteractionYear() || self.psInteractionMonth())
        })

        // Outcome model settings
        self.omCovariates = ko.observable(data.omCovariates != null ? data.omCovariates : 0);

        self.omTrim = ko.observable(data.omTrim != null ? data.omTrim : 0);
        self.omTrimFraction = ko.observable(data.omTrimFraction != null ? data.omTrimFraction : 5);
        self.omMatch = ko.observable(data.omMatch != null ? data.omMatch : 1);
        self.omMatchMaxRatio = ko.observable(data.omMatchMaxRatio != null ? data.omMatchMaxRatio : 1);
        self.omStratNumStrata = ko.observable(data.omStratNumStrata != null ? data.omStratNumStrata : 5);

        self.omDemographicsGender = ko.observable((data.omDemographicsGender == 1)|| false);
        self.omDemographicsRace = ko.observable((data.omDemographicsRace == 1)||false);
        self.omDemographicsEthnicity = ko.observable((data.omDemographicsEthnicity == 1)||false);
        self.omDemographicsAge = ko.observable((data.omDemographicsAge == 1)||false);
        self.omDemographicsYear = ko.observable((data.omDemographicsYear == 1)||false);
        self.omDemographicsMonth = ko.observable((data.omDemographicsMonth == 1)||false);
        
        self.omConditionOcc365d = ko.observable((data.omConditionOcc365d == 1)||false);
        self.omConditionOcc30d = ko.observable((data.omConditionOcc30d == 1)||false);
        self.omConditionOccInpt180d = ko.observable((data.omConditionOccInpt180d == 1)||false);

        self.omConditionEraEver = ko.observable((data.omConditionEraEver == 1)||false);
        self.omConditionEraOverlap = ko.observable((data.omConditionEraOverlap == 1)||false);
        self.omConditionGroupMeddra = ko.observable((data.omConditionGroupMeddra == 1)||false);
        self.omConditionGroupSnomed = ko.observable((data.omConditionGroupSnomed == 1)||false);        
        
        self.omDrugExposure = ko.observable((data.omDrugExposure == 1)||false);
        self.omDrugInPrior30d = ko.observable((data.omDrugExposure30d == 1 || data.omDrugEraExposure30d == 1) || false); 
        self.omDrugInPrior365d = ko.observable((data.omDrugExposure365d == 1 || data.omDrugEraExposure365d == 1) || false);
        
        self.omDrugEra = ko.observable((data.omDrugEra == 1)||false);
        self.omDrugEraOverlap = ko.observable((data.omDrugEraOverlap == 1)||false);
        self.omDrugEraEver = ko.observable((data.omDrugEraEver == 1)||false);
        self.omDrugGroup = ko.observable((data.omDrugGroup == 1)||false);
        
        self.omProcedureOcc365d = ko.observable((data.omProcedureOcc365d == 1)||false);
        self.omProcedureOcc30d = ko.observable((data.omProcedureOcc30d == 1)||false);
        self.omProcedureGroup = ko.observable((data.omProcedureGroup == 1)||false);
        
        self.omObservation = ko.observable((data.omObservation == 1)||false);
        self.omObservation365d = ko.observable((data.omObservation365d == 1)||false);
        self.omObservation30d = ko.observable((data.omObservation30d == 1)||false);
        self.omObservationCount365d = ko.observable((data.omObservationCount365d == 1)||false);
        
        self.omMeasurement365d = ko.observable((data.omMeasurement365d == 1)||false);
        self.omMeasurement30d = ko.observable((data.omMeasurement30d == 1)||false);
        self.omMeasurementCount365d = ko.observable((data.omMeasurementCount365d == 1)||false);
        self.omMeasurementBelow = ko.observable((data.omMeasurementBelow == 1)||false);
        self.omMeasurementAbove = ko.observable((data.omMeasurementAbove == 1)||false);
        
        self.omConceptCounts = ko.observable((data.omConceptCounts == 1)||false);

        self.omRiskScoresCharlson = ko.observable((data.omRiskScoresCharlson == 1)||false);
        self.omRiskScoresDcsi = ko.observable((data.omRiskScoresDcsi == 1)||false);
        self.omRiskScoresChads2 = ko.observable((data.omRiskScoresChads2 == 1)||false);
        self.omRiskScoresChads2vasc = ko.observable((data.omRiskScoresChads2vasc == 1)||false);
        
        self.omInteractionYear = ko.observable((data.omInteractionYear == 1)||false);
        self.omInteractionMonth = ko.observable((data.omInteractionMonth == 1)||false);

        // Outcome Model Settings - Derived
        self.omDemographics = ko.pureComputed(function () {
			return (self.omDemographicsGender() || self.omDemographicsRace() || self.omDemographicsEthnicity() || self.omDemographicsAge() || self.omDemographicsYear() || self.omDemographicsMonth());
		});
        self.omDemographicsIndeterminate = function() {
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
        self.omConditionOcc = ko.pureComputed(function() {
            return (self.omConditionOcc365d() || self.omConditionOcc30d() || self.omConditionOccInpt180d())
        });
        self.omConditionEra = ko.pureComputed(function() {
            return (self.omConditionEraEver() || self.omConditionEraOverlap())
        });
        self.omConditionGroup = ko.pureComputed(function() {
            return (self.omConditionGroupMeddra() || self.omConditionGroupSnomed())
        });
        self.omCondition = ko.pureComputed(function() {
            return (self.omConditionOcc() || self.omConditionEra())
        });
        self.omDrug = ko.pureComputed(function() {
            return (self.omDrugInPrior30d() || self.omDrugInPrior365d() || self.omDrugEraOverlap() || self.omDrugEraEver())
        });
        self.omDrugAggregation = ko.pureComputed(function() {
            return (self.omDrugExposure() || self.omDrugEra() || self.omDrugGroup())
        });
        self.omDrugExposure365d = ko.pureComputed(function() {
            return (self.omDrugExposure() && self.omDrugInPrior365d())
        });
        self.omDrugExposure30d = ko.pureComputed(function() {
            return (self.omDrugExposure() && self.omDrugInPrior30d())
        });
        self.omDrugEra365d = ko.pureComputed(function() {
            return (self.omDrugEra() && self.omDrugInPrior365d())
        });
        self.omDrugEra30d = ko.pureComputed(function() {
            return (self.omDrugEra() && self.omDrugInPrior30d())
        });
        self.omProcedureOcc = ko.pureComputed(function() {
            return (self.omProcedureOcc365d() || self.omProcedureOcc30d() || self.omProcedureGroup())
        });
        self.omMeasurement = ko.pureComputed(function() {
            return (self.omMeasurement365d() || self.omMeasurement30d() || self.omMeasurementCount365d() || self.omMeasurementBelow() || self.omMeasurementAbove())
        });
        self.omRiskScores = ko.pureComputed(function() {
            return (self.omRiskScoresCharlson() || self.omRiskScoresDcsi() || self.omRiskScoresChads2() || self.omRiskScoresChads2vasc())
        });
        self.omInteraction = ko.pureComputed(function() {
            return (self.omInteractionYear() || self.omInteractionMonth())
        });
	}
	return ComparativeCohortAnalysis;
});