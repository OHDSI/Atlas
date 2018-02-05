define(function (require, exports) {

	var ko = require('knockout');
	var CohortDefinition = require('cohortbuilder/CohortDefinition')
	var ConceptSet = require('conceptsetbuilder/InputTypes/ConceptSet')

	function PatientLevelPredictionAnalysis(data) {
		var self = this;
		var data = data || {};

		// Hold a reference to the original
		self.original = data;

		// Model Options
		self.moAlpha = ko.observable(data.moAlpha != null ? data.moAlpha : '0.00001');
		self.moClassWeight = ko.observable(data.moClassWeight != null ? data.moClassWeight : 'None');
		self.moIndexFolder = ko.observable(data.moIndexFolder != null ? data.moIndexFolder : 'file.path(getwd(), "knn")');
		self.moK = ko.observable(data.moK != null ? data.moK : '1000');
		self.moLearnRate = ko.observable(data.moLearnRate != null ? data.moLearnRate : '0.1');
		self.moLearningRate = ko.observable(data.moLearningRate != null ? data.moLearningRate : '1');
		self.moMaxDepth = ko.observable(data.moMaxDepth != null ? data.moMaxDepth : '17');
		self.moMinImpuritySplit = ko.observable(data.moMinImpuritySplit != null ? data.moMinImpuritySplit : '0.0000001');
		self.moMinRows = ko.observable(data.moMinRows != null ? data.moMinRows : '20');
		self.moMinSamplesLeaf = ko.observable(data.moMinSamplesLeaf != null ? data.moMinSamplesLeaf : '10');
		self.moMinSamplesSplit = ko.observable(data.moMinSamplesSplit != null ? data.moMinSamplesSplit : '2');
		self.moMTries = ko.observable(data.moMTries != null ? data.moMTries : '-1');
		self.moNEstimators = ko.observable(data.moNEstimators != null ? data.moNEstimators : '50');
		self.moNThread = ko.observable(data.moNThread != null ? data.moNThread : '20');
		self.moNTrees = ko.observable(data.moNTrees != null ? data.moNTrees : '10, 500');
		self.moPlot = ko.observable(data.moPlot != null ? data.moPlot : 'NULL');
		self.moSeed = ko.observable(data.moSeed != null ? data.moSeed : 'NULL');
		self.moSize = ko.observable(data.moSize != null ? data.moSize : '4');
		self.moVariance = ko.observable(data.moVariance != null ? data.moVariance : '0.01');
		self.moVarImp = ko.observable(data.moVarImp != null ? data.moVarImp : 'TRUE');

		// Options
		self.modelTypeOptions = [
			{
				name: 'Random Forest',
				id: 1,
				modelSettings: [
					{
						setting: 'moMaxDepth',
						name: 'Max depth',
						description: 'Maximum number of interactions - a large value will lead to slow model training',
						defaultValue: '17',
						reference: self.moMaxDepth,
					},
					{
						setting: 'moMTries',
						name: 'Number of tree features',
						description: 'The number of features to include in each tree (-1 defaults to square root of total features)',
						defaultValue: '-1',
						reference: self.moMTries,
					},
					{
						setting: 'moNTrees',
						name: 'Number of tress to build',
						description: 'The number of trees to build',
						defaultValue: '10, 500',
						reference: self.moNTrees,
					},
					{
						setting: 'moVarImp',
						name: 'Perform an initial variable selection',
						description: 'Perform an initial variable selection prior to fitting the model to select the useful variables',
						defaultValue: 'TRUE',
						reference: self.moVarImp,
					},
				]
		},
			{
				name: 'Naive Bayes',
				id: 2,
				modelSettings: []
		},
			{
				name: 'Multilayer Perception Model (MLP)',
				id: 3,
				modelSettings: [
					{
						setting: 'moAlpha',
						name: 'Alpha',
						description: 'The l2 regularisation',
						defaultValue: '0.00001',
						reference: self.moAlpha,
					},
					{
						setting: 'moSize',
						name: 'Number of hidden nodes',
						description: 'The number of hidden nodes',
						defaultValue: '4',
						reference: self.moSize,
					},
				]
		},
			{
				name: 'K Nearest Neighbors',
				id: 4,
				modelSettings: [
					{
						setting: 'moK',
						name: 'Number of neighbors',
						description: 'The number of neighbors to consider',
						defaultValue: '1000',
						reference: self.moK,
					},
				]
		},
			{
				name: 'Gradient Boosting Machine',
				id: 5,
				modelSettings: [
					{
						setting: 'moLearnRate',
						name: 'Boosting learn rate',
						description: 'The boosting learn rate',
						defaultValue: '0.1',
						reference: self.moLearnRate,
					},
					{
						setting: 'moMaxDepth',
						name: 'Maximum number of interactions',
						description: 'Maximum number of interactions - a large value will lead to slow model training',
						defaultValue: '6',
						reference: self.moMaxDepth,
					},
					{
						setting: 'moMinRows',
						name: 'Minimum number of rows',
						description: 'The minimum number of rows required at each end node of the tree',
						defaultValue: '20',
						reference: self.moMinRows,
					},
					{
						setting: 'moNThread',
						name: 'Computer threads for computation',
						description: 'The number of computer threads to use (how many cores do you have?)',
						defaultValue: '20',
						reference: self.moNThread,
					},
					{
						setting: 'moNTrees',
						name: 'Trees to build',
						description: 'The number of trees to build',
						defaultValue: '10, 100',
						reference: self.moNTrees,
					},
					{
						setting: 'moSize',
						name: 'Number of hidden nodes',
						description: 'The number of hidden nodes',
						defaultValue: 'NULL',
						reference: self.moSize,
					},
				]
		},
			{
				name: 'Decision Tree',
				id: 6,
				modelSettings: [
					{
						setting: 'moClassWeight',
						name: 'Class weight',
						description: 'Class Weight',
						defaultValue: 'None',
						reference: self.moClassWeight,
					},
					{
						setting: 'moMaxDepth',
						name: 'Max depth',
						description: 'Maximum number of interactions - a large value will lead to slow model training',
						defaultValue: '17',
						reference: self.moMaxDepth,
					},
					{
						setting: 'moMinImpuritySplit',
						name: 'Minimum impurity split',
						description: 'Threshold for early stopping in tree growth. A node will split if its impurity is above the threshold, otherwise it is a leaf.',
						defaultValue: '0.0000001',
						reference: self.moMinImpuritySplit,
					},
					{
						setting: 'moMinSamplesLeaf',
						name: 'Minimum samples per leaf',
						description: 'The minimum number of samples per leaf',
						defaultValue: '10',
						reference: self.moMinSamplesLeaf,
					},
					{
						setting: 'moMinSamplesSplit',
						name: 'Minimum samples per split',
						description: 'The minimum samples per split',
						defaultValue: '2',
						reference: self.moMinSamplesSplit,
					},
				]
		},
			{
				name: 'Ada Boost',
				id: 7,
				modelSettings: [
					{
						setting: 'moLearningRate',
						name: 'Learning rate',
						description: 'Learning rate shrinks the contribution of each classifier. There is a trade-off between learning rate and nEstimators.',
						defaultValue: '1',
						reference: self.moLearningRate,
					},
					{
						setting: 'moNEstimators',
						name: 'Maximum number of estimators',
						description: 'The maximum number of estimators at which boosting is terminated',
						defaultValue: '50',
						reference: self.moNEstimators,
					},
				]
		},
			{
				name: 'Lasso Logistic Regression',
				id: 8,
				modelSettings: [
					{
						setting: 'moVariance',
						name: 'Starting value for the automatic lambda search',
						description: 'A single value used as the starting value for the automatic lambda search',
						defaultValue: '0.01',
						reference: self.moVariance,
					},
				]
		}];
		self.testSplitOptions = [
			{
				name: 'time',
				desc: 'Time',
				id: 0
		},
			{
				name: 'person',
				desc: 'Person',
				id: 1
		}
		];

		// Properties
		self.analysisId = data.analysisId || null;
		self.name = ko.observable(data.name || null);
		self.nameMultiLine = ko.pureComputed(function () {
			var maxLength = 45;
			var nameFormatted = [];
			if (self.name() && self.name().length > 0) {
				var nameSplit = self.name().split(" ");
				var curName = "";
				for (i = 0; i < nameSplit.length; i++) {
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
		self.timeAtRiskEnd = ko.observable(data.timeAtRiskEnd != null ? data.timeAtRiskEnd : 365);
		self.addExposureDaysToEnd = ko.observable(data.addExposureDaysToEnd != null ? data.addExposureDaysToEnd : 0);
		self.addExposureDaysToEndFormatted = ko.pureComputed(function () {
			return self.addExposureDaysToEnd() == 1;
		})
		self.minimumWashoutPeriod = ko.observable(data.minimumWashoutPeriod != null ? data.minimumWashoutPeriod : 365);
		self.minimumDaysAtRisk = ko.observable(data.minimumDaysAtRisk != null ? data.minimumDaysAtRisk : 0);
		self.requireTimeAtRisk = ko.observable(data.requireTimeAtRisk != null ? data.requireTimeAtRisk : 1);
		self.requireTimeAtRiskFormatted = ko.pureComputed(function () {
			return self.requireTimeAtRisk() == 1;
		});
		self.minTimeAtRisk = ko.pureComputed(function () {
			return self.timeAtRiskEnd() - self.timeAtRiskStart();
		});
		self.sample = ko.observable(data.sampleSize != null ? data.sample : 1)
		self.sampleSize = ko.observable(data.sampleSize != null ? data.sampleSize : 10000)
		self.sampleSizeFormatted = ko.pureComputed(function () {
			if (self.sample() == 0) {
				return 'NULL';
			} else {
				return self.sampleSize();
			}
		});
		self.firstExposureOnly = ko.observable(data.firstExposureOnly != null ? data.firstExposureOnly : 1);
		self.firstExposureOnlyFormatted = ko.pureComputed(function () {
			return self.firstExposureOnly() == 1;
		});
		self.firstExposureOnlyDescription = ko.pureComputed(function () {
			return self.firstExposureOnly() == 1 ? "the first exposure" : "all exposures";
		});

		self.includeAllOutcomes = ko.observable(data.includeAllOutcomes != null ? data.includeAllOutcomes : 1);
		self.includeAllOutcomesFormatted = ko.pureComputed(function () {
			return self.includeAllOutcomes() == 1;
		})
		self.includeAllOutcomesDescription = ko.pureComputed(function () {
			return self.includeAllOutcomes() == 1 ? "include" : "exclude";
		})
		self.rmPriorOutcomes = ko.observable(data.rmPriorOutcomes != null ? data.rmPriorOutcomes : 1);
		self.rmPriorOutcomesFormatted = ko.pureComputed(function () {
			return self.rmPriorOutcomes() == 1;
		});
		self.priorOutcomeLookback = ko.observable(data.priorOutcomeLookback != null ? data.priorOutcomeLookback : 99999);
		self.priorOutcomeLookbackFormatted = ko.pureComputed(function () {
			return self.priorOutcomeLookback().toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
		})
		self.testSplit = ko.observable(data.testSplit != null ? data.testSplit : 0);
		self.testSplitDescription = ko.pureComputed(function () {
			returnVal = '';
			if (self.testSplit() != null) {
				returnVal = self.testSplitOptions.filter(function (item) {
					return item.id == self.testSplit();
				})[0].name
			}
			return returnVal;
		});
		self.testFraction = ko.observable(data.testFraction != null ? data.testFraction : 25)
		self.testFractionRemainder = ko.pureComputed(function () {
			returnVal = 100 - self.testFraction();
			if (returnVal > 100 || returnVal < 0) {
				return 0;
			} else {
				return returnVal;
			}
		});
		self.testFractionFormatted = ko.pureComputed(function () {
			return self.testFraction() / 100;
		});
		self.testFractionDescription = ko.pureComputed(function () {
			return self.testFraction() + "%";
		});
		self.testFractionRemainderDescription = ko.pureComputed(function () {
			return self.testFractionRemainder() + "%";
		})
		self.nFold = ko.observable(data.nFold != null ? data.nFold : 3);

		self.treatmentId = ko.observable(data.treatmentId != null ? data.treatmentId : 0);
		self.treatmentCaption = ko.observable(data.treatmentCaption != null ? data.treatmentCaption : null);
		if (data.treatmentCohortDefinition != null) {
			jsonCohortDefinition = JSON.parse(data.treatmentCohortDefinition);
			self.treatmentCohortDefinition = ko.observable(new CohortDefinition(jsonCohortDefinition));
		} else {
			self.treatmentCohortDefinition = ko.observable(null);
		}

		self.outcomeId = ko.observable(data.outcomeId != null ? data.outcomeId : 0);
		self.outcomeCaption = ko.observable(data.outcomeCaption != null ? data.outcomeCaption : null);
		if (data.outcomeCohortDefinition != null) {
			jsonCohortDefinition = JSON.parse(data.outcomeCohortDefinition);
			self.outcomeCohortDefinition = ko.observable(new CohortDefinition(jsonCohortDefinition));
		} else {
			self.outcomeCohortDefinition = ko.observable(null);
		}

		self.cvExclusionId = ko.observable(data.cvExclusionId != null ? data.cvExclusionId : 0);
		self.cvExclusionCaption = ko.observable(data.cvExclusionCaption != null ? data.cvExclusionCaption : null);
		self.cvExclusionConceptSet = ko.observableArray(null);
		if (self.cvExclusionId() > 0) {
			var conceptSetData = {
				id: self.cvExclusionId(),
				name: self.cvExclusionCaption(),
				expression: data.cvExclusionConceptSet
			};
			self.cvExclusionConceptSet.push(new ConceptSet(conceptSetData));
			self.cvExclusionConceptSetSQL = ko.observable(data.cvExclusionConceptSetSql)
		} else {
			self.cvExclusionConceptSetSQL = ko.observable(null);
		}

		self.cvInclusionId = ko.observable(data.cvInclusionId != null ? data.cvInclusionId : 0);
		self.cvInclusionCaption = ko.observable(data.cvInclusionCaption != null ? data.cvInclusionCaption : null);
		self.cvInclusionConceptSet = ko.observableArray(null);
		if (self.cvInclusionId() > 0) {
			var conceptSetData = {
				id: self.cvInclusionId(),
				name: self.cvInclusionCaption(),
				expression: data.cvInclusionConceptSet
			};
			self.cvInclusionConceptSet.push(new ConceptSet(conceptSetData));
			self.cvInclusionConceptSetSQL = ko.observable(data.cvInclusionConceptSetSql)
		} else {
			self.cvInclusionConceptSetSQL = ko.observable(null);
		}

		self.modelType = ko.observable(data.modelType != null ? data.modelType : null);
		self.delCovariatesSmallCount = ko.observable(data.delCovariatesSmallCount != null ? data.delCovariatesSmallCount : 20);

		// Derived fields
		self.modelTypeName = function () {
			returnVal = '';
			if (self.modelType() != null) {
				returnVal = self.modelTypeOptions.filter(function (item) {
					return item.id == self.modelType();
				})[0].name
			}
			return returnVal;
		}

		self.modelTypeSettings = ko.pureComputed(function () {
			returnVal = [];
			if (self.modelType() != null) {
				returnVal = self.modelTypeOptions.filter(function (item) {
					return item.id == self.modelType();
				})[0].modelSettings
			}
			return returnVal;
		});

		self.readyForDisplay = function () {
			return (self.treatmentId() != null && self.treatmentId() > 0 &&
				self.outcomeId() != null && self.outcomeId() > 0 &&
				self.modelType() != null)
		}

		// Covariate Settings
		self.cvDemographicsGender = ko.observable((data.cvDemographicsGender == 1) || false);
		self.cvDemographicsRace = ko.observable((data.cvDemographicsRace == 1) || false);
		self.cvDemographicsEthnicity = ko.observable((data.cvDemographicsEthnicity == 1) || false);
		self.cvDemographicsAge = ko.observable((data.cvDemographicsAge == 1) || false);
		self.cvDemographicsYear = ko.observable((data.cvDemographicsYear == 1) || false);
		self.cvDemographicsMonth = ko.observable((data.cvDemographicsMonth == 1) || false);

		self.cvConditionOcc365d = ko.observable((data.cvConditionOcc365d == 1) || false);
		self.cvConditionOcc30d = ko.observable((data.cvConditionOcc30d == 1) || false);
		self.cvConditionOccInpt180d = ko.observable((data.cvConditionOccInpt180d == 1) || false);

		self.cvConditionEraEver = ko.observable((data.cvConditionEraEver == 1) || false);
		self.cvConditionEraOverlap = ko.observable((data.cvConditionEraOverlap == 1) || false);
		self.cvConditionGroupMeddra = ko.observable((data.cvConditionGroupMeddra == 1) || false);
		self.cvConditionGroupSnomed = ko.observable((data.cvConditionGroupSnomed == 1) || false);

		self.cvDrugInPrior30d = ko.observable((data.cvDrugExposure30d == 1 || data.cvDrugEra30d == 1) || false);
		self.cvDrugInPrior365d = ko.observable((data.cvDrugExposure365d == 1 || data.cvDrugEra365d == 1) || false);

		self.cvDrugEra = ko.observable((data.cvDrugEra == 1) || false);
		self.cvDrugEraOverlap = ko.observable((data.cvDrugEraOverlap == 1) || false);
		self.cvDrugEraEver = ko.observable((data.cvDrugEraEver == 1) || false);
		self.cvDrugGroup = ko.observable((data.cvDrugGroup == 1) || false);

		self.cvProcedureOcc365d = ko.observable((data.cvProcedureOcc365d == 1) || false);
		self.cvProcedureOcc30d = ko.observable((data.cvProcedureOcc30d == 1) || false);
		self.cvProcedureGroup = ko.observable((data.cvProcedureGroup == 1) || false);

		self.cvObservation = ko.observable((data.cvObservation == 1) || false);
		self.cvObservation365d = ko.observable((data.cvObservation365d == 1) || false);
		self.cvObservation30d = ko.observable((data.cvObservation30d == 1) || false);
		self.cvObservationCount365d = ko.observable((data.cvObservationCount365d == 1) || false);

		self.cvMeasurement365d = ko.observable((data.cvMeasurement365d == 1) || false);
		self.cvMeasurement30d = ko.observable((data.cvMeasurement30d == 1) || false);
		self.cvMeasurementCount365d = ko.observable((data.cvMeasurementCount365d == 1) || false);
		self.cvMeasurementBelow = ko.observable((data.cvMeasurementBelow == 1) || false);
		self.cvMeasurementAbove = ko.observable((data.cvMeasurementAbove == 1) || false);

		self.cvConceptCounts = ko.observable((data.cvConceptCounts == 1) || false);

		self.cvRiskScoresCharlson = ko.observable((data.cvRiskScoresCharlson == 1) || false);
		self.cvRiskScoresDcsi = ko.observable((data.cvRiskScoresDcsi == 1) || false);
		self.cvRiskScoresChads2 = ko.observable((data.cvRiskScoresChads2 == 1) || false);
		self.cvRiskScoresChads2vasc = ko.observable((data.cvRiskScoresChads2vasc == 1) || false);

		self.cvInteractionYear = ko.observable((data.cvInteractionYear == 1) || false);
		self.cvInteractionMonth = ko.observable((data.cvInteractionMonth == 1) || false);

		// Covariate Settings - Derived
		self.cvDemographics = ko.pureComputed(function () {
			return (self.cvDemographicsGender() || self.cvDemographicsRace() || self.cvDemographicsEthnicity() || self.cvDemographicsAge() || self.cvDemographicsYear() || self.cvDemographicsMonth());
		});
		self.cvDemographicsIndeterminate = function () {
			var propCount = 0;
			propCount += self.cvDemographicsGender() | 0;
			propCount += self.cvDemographicsRace() | 0;
			propCount += self.cvDemographicsEthnicity() | 0;
			propCount += self.cvDemographicsAge() | 0;
			propCount += self.cvDemographicsYear() | 0;
			propCount += self.cvDemographicsMonth() | 0;
			return (propCount > 0 && propCount < 6);
		}
		self.cvConditionOcc = ko.pureComputed(function () {
			return (self.cvConditionOcc365d() || self.cvConditionOcc30d() || self.cvConditionOccInpt180d())
		});
		self.cvConditionEra = ko.pureComputed(function () {
			return (self.cvConditionEraEver() || self.cvConditionEraOverlap())
		});
		self.cvConditionGroup = ko.pureComputed(function () {
			return (self.cvConditionGroupMeddra() || self.cvConditionGroupSnomed())
		});
		self.cvCondition = ko.pureComputed(function () {
			return (self.cvConditionOcc() || self.cvConditionEra())
		});
		self.cvDrug = ko.pureComputed(function () {
			return (self.cvDrugInPrior30d() || self.cvDrugInPrior365d() || self.cvDrugEraOverlap() || self.cvDrugEraEver())
		});
		self.cvDrugExposure = ko.pureComputed(function() {
			return (self.cvDrugInPrior30d() || self.cvDrugInPrior365d())
		})
		self.cvDrugAggregation = ko.pureComputed(function () {
			return (self.cvDrugEra() || self.cvDrugGroup())
		});
		self.cvDrugExposure365d = ko.pureComputed(function () {
			return self.cvDrugInPrior365d()
		});
		self.cvDrugExposure30d = ko.pureComputed(function () {
			return self.cvDrugInPrior30d()
		});
		self.cvDrugEra365d = ko.pureComputed(function () {
			return (self.cvDrugEra() && self.cvDrugInPrior365d())
		});
		self.cvDrugEra30d = ko.pureComputed(function () {
			return (self.cvDrugEra() && self.cvDrugInPrior30d())
		});
		self.cvProcedureOcc = ko.pureComputed(function () {
			return (self.cvProcedureOcc365d() || self.cvProcedureOcc30d() || self.cvProcedureGroup())
		})
		self.cvMeasurement = ko.pureComputed(function () {
			return (self.cvMeasurement365d() || self.cvMeasurement30d() || self.cvMeasurementCount365d() || self.cvMeasurementBelow() || self.cvMeasurementAbove())
		})
		self.cvRiskScores = ko.pureComputed(function () {
			return (self.cvRiskScoresCharlson() || self.cvRiskScoresDcsi() || self.cvRiskScoresChads2() || self.cvRiskScoresChads2vasc())
		})
		self.cvInteraction = ko.pureComputed(function () {
			return (self.cvInteractionYear() || self.cvInteractionMonth())
		})

		self.getCurrentModelSettingsByName = function (settingName) {
			var currentModelSettings = self.modelTypeSettings().filter(function (item) {
				return item.setting == settingName;
			});
			return currentModelSettings;
		}

		self.isDefaultModelSetting = function (settingName) {
			var returnVal = true;
			var currentSetting = self.getCurrentModelSettingsByName(settingName);
			if (currentSetting && currentSetting.length > 0) {
				returnVal = (currentSetting[0].reference() == currentSetting[0].defaultValue);
			}
			return returnVal;
		}

		self.moAlphaIsDefault = ko.pureComputed(function () {
			return self.isDefaultModelSetting("moAlpha");
		});

		self.moClassWeightIsDefault = ko.pureComputed(function () {
			return self.isDefaultModelSetting("moClassWeight");
		});

		self.moIndexFolderIsDefault = ko.pureComputed(function () {
			return self.isDefaultModelSetting("moIndexFolder");
		});

		self.moKIsDefault = ko.pureComputed(function () {
			return self.isDefaultModelSetting("moK");
		});

		self.moLearnRateIsDefault = ko.pureComputed(function () {
			return self.isDefaultModelSetting("moLearnRate");
		});

		self.moLearningRateIsDefault = ko.pureComputed(function () {
			return self.isDefaultModelSetting("moLearningRate");
		});

		self.moMaxDepthIsDefault = ko.pureComputed(function () {
			return self.isDefaultModelSetting("moMaxDepth");
		});

		self.moMinImpuritySplitIsDefault = ko.pureComputed(function () {
			return self.isDefaultModelSetting("moMinImpuritySplit");
		});

		self.moMinRowsIsDefault = ko.pureComputed(function () {
			return self.isDefaultModelSetting("moMinRows");
		});

		self.moMinSamplesLeafIsDefault = ko.pureComputed(function () {
			return self.isDefaultModelSetting("moMinSamplesLeaf");
		});

		self.moMinSamplesSplitIsDefault = ko.pureComputed(function () {
			return self.isDefaultModelSetting("moMinSamplesSplit");
		});

		self.moMTriesIsDefault = ko.pureComputed(function () {
			return self.isDefaultModelSetting("moMTries");
		});

		self.moNEstimatorsIsDefault = ko.pureComputed(function () {
			return self.isDefaultModelSetting("moNEstimators");
		});

		self.moNThreadIsDefault = ko.pureComputed(function () {
			return self.isDefaultModelSetting("moNThread");
		});

		self.moNTreesIsDefault = ko.pureComputed(function () {
			return self.isDefaultModelSetting("moNTrees");
		});

		self.moPlotIsDefault = ko.pureComputed(function () {
			return self.isDefaultModelSetting("moPlot");
		});

		self.moSeedIsDefault = ko.pureComputed(function () {
			return self.isDefaultModelSetting("moSeed");
		});

		self.moSizeIsDefault = ko.pureComputed(function () {
			return self.isDefaultModelSetting("moSize");
		});

		self.moVarianceIsDefault = ko.pureComputed(function () {
			return self.isDefaultModelSetting("moVariance");
		});

		self.moVarImpIsDefault = ko.pureComputed(function () {
			return self.isDefaultModelSetting("moVarImp");
		});
	}
	return PatientLevelPredictionAnalysis;
});
