define([
	'knockout',
	'text!./plp-manager.html',
	'providers/Component',
	'providers/AutoBind',
	'utils/CommonUtils',
	'services/http',
	'services/PatientLevelPrediction',
	'services/Execution',
	'services/JobDetailsService',
	'webapi/AuthAPI',
	'jquery',
	'appConfig',
	'assets/ohdsi.util',
	'plp/PatientLevelPredictionAnalysis',
	'clipboard',
	'atlas-state',
],
	function (
		ko,
		view,
		Component,
		AutoBind,
		commonUtils,
		httpService,
		plpService,
		executionService,
		jobDetailsService,
		authApi,
		$,
		config,
		ohdsiUtil,
		PatientLevelPredictionAnalysis,
		clipboard,
		sharedState,
	) {
	class PlpManager extends AutoBind(Component) {
		constructor(params) {
			super();			
			this.patientLevelPredictionId = params.currentPatientLevelPredictionId;
			this.currentPlpAnalysis = params.currentPatientLevelPrediction;
			this.patientLevelPredictionDirtyFlag = params.dirtyFlag;
			this.loading = ko.observable(true);
			this.tabMode = ko.observable('specification');
			this.performanceTabMode = ko.observable('discrimination');
			this.expressionMode = ko.observable('print');

			this.sourceHistoryDisplay = {};
			this.sourceProcessingStatus = {};
			this.sourceExecutions = {};

			const initSources = sharedState.sources().filter(s => s.hasCDM);
			initSources.forEach((source) => {
				this.sourceHistoryDisplay[source.sourceKey] = ko.observable(false);
				this.sourceProcessingStatus[source.sourceKey] = ko.observable(false);
			});
			this.sources = ko.observable(initSources);
			
			this.canSave = ko.pureComputed(() => {
				return (
					this.currentPlpAnalysis().name()
					&& this.currentPlpAnalysis().treatmentId()
					&& this.currentPlpAnalysis().treatmentId() > 0
					&& this.currentPlpAnalysis().outcomeId()
					&& this.currentPlpAnalysis().outcomeId() > 0
					&& this.currentPlpAnalysis().modelType
					&& this.currentPlpAnalysis().modelType() > 0
					&& this.patientLevelPredictionDirtyFlag()
					&& this.patientLevelPredictionDirtyFlag().isDirty());
			});			
			this.canDelete = ko.pureComputed(() => {
				return authApi.isPermittedDeletePlp(this.patientLevelPredictionId);
			});

			this.plpResultsEnabled = config.plpResultsEnabled;
			this.isExecutionEngineAvailable = config.api.isExecutionEngineAvailable;
			this.useExecutionEngine = config.useExecutionEngine;
			
			// startup actions
			if (this.patientLevelPredictionId() == 0 && this.currentPlpAnalysis() == null) {
				this.newPatientLevelPrediction();
			} else if (this.patientLevelPredictionId() > 0 && this.patientLevelPredictionId() != (this.currentPlpAnalysis() && this.currentPlpAnalysis().analysisId)) {
				this.loadPatientLevelPrediction();
			} else {
				// already loaded
				this.loading(false);
			}
			this.loadExecutions();
		}

		loadExecutions () {
			// reset before load
			this.sources().forEach((s) => {
				if (!this.sourceExecutions[s.sourceKey]) {
					this.sourceExecutions[s.sourceKey] = ko.observableArray();
				} else {
					this.sourceExecutions[s.sourceKey].removeAll();
				}

				executionService.loadExecutions('PLP', this.patientLevelPredictionId(), (exec) => {
					const source = this.sources().find(s => s.sourceId == exec.sourceId);
					if (source) {
							const sourceKey = source.sourceKey;
							this.sourceProcessingStatus[sourceKey](exec.executionStatus !== 'COMPLETED' && exec.executionStatus !== 'FAILED');
							this.sourceExecutions[sourceKey].remove(e => e.id === exec.id);
							this.sourceExecutions[sourceKey].push(exec);
					}
				});
			});
		}

		monitorEEJobExecution (jobExecutionId, wait) {
			setTimeout(function () {
				httpService.doGet(config.api.url + 'executionservice/execution/status/' + jobExecutionId)
				.then(({ data }) => {
						this.loadExecutions();
						if (data !== 'COMPLETED' && data !== 'FAILED') {
							this.monitorEEJobExecution(jobExecutionId, 6000);
						}
					});
			}, wait);
		}

		executePLP (sourceKey) {
			if (config.useExecutionEngine) {
				this.sourceProcessingStatus[sourceKey](true);
				executionService.runExecution(
					sourceKey,
					this.patientLevelPredictionId(),
					'PLP',
					$('.language-r').text()
				)
					.then(({ data }) => {
						this.monitorEEJobExecution(data.executionId, 100);
						jobDetailsService.createJob({
							name: this.currentPlpAnalysis().name() + "_" + sourceKey,
							type: 'plp',
							status: 'PENDING',
							executionId: data.executionId,
							statusUrl: `${config.api.url}executionservice/execution/status/${data.executionId}`,
							statusValue: 'status',
							viewed: false,
							url: 'plp/' + this.patientLevelPredictionId(),
						})
					});
			}
		};

		viewLastExecution (source) {
			const executionCount = this.sourceExecutions[source.sourceKey]().length - 1;
			for (let e = executionCount; e >= 0; e--) {
				const execution = this.sourceExecutions[source.sourceKey]()[e];
				if (execution.executionStatus === 'COMPLETED' || execution.executionStatus === 'FAILED') {
					this.executionSelected(execution);
					break;
				}
			}
		};

		executionSelected (execution) {
			if(config.useExecutionEngine){
				executionService.viewResults(execution.id);
			}
		};

		toggleHistoryDisplay (sourceKey) {
			this.sourceHistoryDisplay[sourceKey](!this.sourceHistoryDisplay[sourceKey]());
		};


		copyToClipboard (element) {
			const currentClipboard = new clipboard('#btnCopyToClipboard');

			currentClipboard.on('success', function (e) {
				console.log('Copied to clipboard');
				e.clearSelection();
				$('.copyToClipboardMessage').fadeIn();
				setTimeout(function () {
					$('.copyToClipboardMessage').fadeOut();
				}, 1500);
			});

			currentClipboard.on('error', function (e) {
				console.log('Error copying to clipboard');
				console.log(e);
			});
		}

		delete () {
			if (!confirm("Delete estimation specification? Warning: deletion can not be undone!"))
				return;

			plpService.deletePlp(this.patientLevelPredictionId()).then(() => {
				this.currentPlpAnalysis(null);
				this.patientLevelPredictionId(null);
				this.patientLevelPredictionDirtyFlag(new ohdsiUtil.dirtyFlag(this.currentPlpAnalysis()));
				document.location = "#/plp"
			}, function (err) {
				console.log("Error during delete", err);
			});
		}

		save () {
			const plpAnalysis = {
				analysisId: this.currentPlpAnalysis().analysisId || null,
				name: this.currentPlpAnalysis().name(),
				treatmentId: this.currentPlpAnalysis().treatmentId(),
				outcomeId: this.currentPlpAnalysis().outcomeId(),
				modelType: this.currentPlpAnalysis().modelType(),
				timeAtRiskStart: this.currentPlpAnalysis().timeAtRiskStart(),
				timeAtRiskEnd: this.currentPlpAnalysis().timeAtRiskEnd(),
				addExposureDaysToEnd: this.currentPlpAnalysis().addExposureDaysToEnd(),
				minimumWashoutPeriod: this.currentPlpAnalysis().minimumWashoutPeriod(),
				minimumDaysAtRisk: this.currentPlpAnalysis().minimumDaysAtRisk(),
				requireTimeAtRisk: this.currentPlpAnalysis().requireTimeAtRisk(),
				minTimeAtRisk: this.currentPlpAnalysis().minTimeAtRisk(),
				sample: this.currentPlpAnalysis().sample(),
				sampleSize: this.currentPlpAnalysis().sampleSize(),
				firstExposureOnly: this.currentPlpAnalysis().firstExposureOnly(),
				includeAllOutcomes: this.currentPlpAnalysis().includeAllOutcomes(),
				rmPriorOutcomes: this.currentPlpAnalysis().rmPriorOutcomes(),
				priorOutcomeLookback: this.currentPlpAnalysis().priorOutcomeLookback(),
				testSplit: this.currentPlpAnalysis().testSplit(),
				testFraction: this.currentPlpAnalysis().testFraction(),
				nFold: this.currentPlpAnalysis().nFold(),
				moAlpha: this.currentPlpAnalysis().moAlpha(),
				moClassWeight: this.currentPlpAnalysis().moClassWeight(),
				moIndexFolder: this.currentPlpAnalysis().moIndexFolder(),
				moK: this.currentPlpAnalysis().moK(),
				moLearnRate: this.currentPlpAnalysis().moLearnRate(),
				moLearningRate: this.currentPlpAnalysis().moLearningRate(),
				moMaxDepth: this.currentPlpAnalysis().moMaxDepth(),
				moMinImpuritySplit: this.currentPlpAnalysis().moMinImpuritySplit(),
				moMinRows: this.currentPlpAnalysis().moMinRows(),
				moMinSamplesLeaf: this.currentPlpAnalysis().moMinSamplesLeaf(),
				moMinSamplesSplit: this.currentPlpAnalysis().moMinSamplesSplit(),
				moMTries: this.currentPlpAnalysis().moMTries(),
				moNEstimators: this.currentPlpAnalysis().moNEstimators(),
				moNThread: this.currentPlpAnalysis().moNThread(),
				moNTrees: this.currentPlpAnalysis().moNTrees(),
				moPlot: this.currentPlpAnalysis().moPlot(),
				moSeed: this.currentPlpAnalysis().moSeed(),
				moSize: this.currentPlpAnalysis().moSize(),
				moVariance: this.currentPlpAnalysis().moVariance(),
				moVarImp: this.currentPlpAnalysis().moVarImp(),
				cvExclusionId: this.currentPlpAnalysis().cvExclusionId(),
				cvInclusionId: this.currentPlpAnalysis().cvInclusionId(),
				cvDemographics: this.currentPlpAnalysis().cvDemographics() | 0,
				cvDemographicsGender: this.currentPlpAnalysis().cvDemographicsGender() | 0,
				cvDemographicsRace: this.currentPlpAnalysis().cvDemographicsRace() | 0,
				cvDemographicsEthnicity: this.currentPlpAnalysis().cvDemographicsEthnicity() | 0,
				cvDemographicsAge: this.currentPlpAnalysis().cvDemographicsAge() | 0,
				cvDemographicsYear: this.currentPlpAnalysis().cvDemographicsYear() | 0,
				cvDemographicsMonth: this.currentPlpAnalysis().cvDemographicsMonth() | 0,
				cvConditionOcc: this.currentPlpAnalysis().cvConditionOcc() | 0,
				cvConditionOcc365d: this.currentPlpAnalysis().cvConditionOcc365d() | 0,
				cvConditionOcc30d: this.currentPlpAnalysis().cvConditionOcc30d() | 0,
				cvConditionOccInpt180d: this.currentPlpAnalysis().cvConditionOccInpt180d() | 0,
				cvConditionEra: this.currentPlpAnalysis().cvConditionEra() | 0,
				cvConditionEraEver: this.currentPlpAnalysis().cvConditionEraEver() | 0,
				cvConditionEraOverlap: this.currentPlpAnalysis().cvConditionEraOverlap() | 0,
				cvConditionGroup: this.currentPlpAnalysis().cvConditionGroup() | 0,
				cvConditionGroupMeddra: this.currentPlpAnalysis().cvConditionGroupMeddra() | 0,
				cvConditionGroupSnomed: this.currentPlpAnalysis().cvConditionGroupSnomed() | 0,
				cvDrugExposure: this.currentPlpAnalysis().cvDrugExposure() | 0,
				cvDrugExposure365d: this.currentPlpAnalysis().cvDrugExposure365d() | 0,
				cvDrugExposure30d: this.currentPlpAnalysis().cvDrugExposure30d() | 0,
				cvDrugEra: this.currentPlpAnalysis().cvDrugEra() | 0,
				cvDrugEra365d: this.currentPlpAnalysis().cvDrugEra365d() | 0,
				cvDrugEra30d: this.currentPlpAnalysis().cvDrugEra30d() | 0,
				cvDrugEraOverlap: this.currentPlpAnalysis().cvDrugEraOverlap() | 0,
				cvDrugEraEver: this.currentPlpAnalysis().cvDrugEraEver() | 0,
				cvDrugGroup: this.currentPlpAnalysis().cvDrugGroup() | 0,
				cvProcedureOcc: this.currentPlpAnalysis().cvProcedureOcc() | 0,
				cvProcedureOcc365d: this.currentPlpAnalysis().cvProcedureOcc365d() | 0,
				cvProcedureOcc30d: this.currentPlpAnalysis().cvProcedureOcc30d() | 0,
				cvProcedureGroup: this.currentPlpAnalysis().cvProcedureGroup() | 0,
				cvObservation: this.currentPlpAnalysis().cvObservation() | 0,
				cvObservation365d: this.currentPlpAnalysis().cvObservation365d() | 0,
				cvObservation30d: this.currentPlpAnalysis().cvObservation30d() | 0,
				cvObservationCount365d: this.currentPlpAnalysis().cvObservationCount365d() | 0,
				cvMeasurement: this.currentPlpAnalysis().cvMeasurement() | 0,
				cvMeasurement365d: this.currentPlpAnalysis().cvMeasurement365d() | 0,
				cvMeasurement30d: this.currentPlpAnalysis().cvMeasurement30d() | 0,
				cvMeasurementCount365d: this.currentPlpAnalysis().cvMeasurementCount365d() | 0,
				cvMeasurementBelow: this.currentPlpAnalysis().cvMeasurementBelow() | 0,
				cvMeasurementAbove: this.currentPlpAnalysis().cvMeasurementAbove() | 0,
				cvConceptCounts: this.currentPlpAnalysis().cvConceptCounts() | 0,
				cvRiskScores: this.currentPlpAnalysis().cvRiskScores() | 0,
				cvRiskScoresCharlson: this.currentPlpAnalysis().cvRiskScoresCharlson() | 0,
				cvRiskScoresDcsi: this.currentPlpAnalysis().cvRiskScoresDcsi() | 0,
				cvRiskScoresChads2: this.currentPlpAnalysis().cvRiskScoresChads2() | 0,
				cvRiskScoresChads2vasc: this.currentPlpAnalysis().cvRiskScoresChads2vasc() | 0,
				cvInteractionYear: this.currentPlpAnalysis().cvInteractionYear() | 0,
				cvInteractionMonth: this.currentPlpAnalysis().cvInteractionMonth() | 0,
				delCovariatesSmallCount: this.currentPlpAnalysis().delCovariatesSmallCount(),
			};
			plpService.savePlp(plpAnalysis).then(({ data: saveResult }) => {
				const redirectWhenComplete = saveResult.analysisId != this.currentPlpAnalysis().analysisId;
				this.patientLevelPredictionId(saveResult.analysisId);
				this.currentPlpAnalysis().analysisId = saveResult.analysisId;
				if (redirectWhenComplete) {
					document.location = "#/plp/" + this.patientLevelPredictionId();
				}
				this.patientLevelPredictionDirtyFlag().reset();
				this.currentPlpAnalysis.valueHasMutated();
			});
		}

		close () {
			if (this.patientLevelPredictionDirtyFlag().isDirty() && !confirm("Patient level prediction changes are not saved. Would you like to continue?")) {
				return;
			}
			this.currentPlpAnalysis(null);
			this.patientLevelPredictionId(null);
			this.patientLevelPredictionDirtyFlag(new ohdsiUtil.dirtyFlag(this.currentPlpAnalysis()));
			document.location = '#/plp';
		}

		copy () {
			plpService.copyPlp(this.patientLevelPredictionId()).then(({ data: result }) => {
				document.location = "#/plp/" + result.analysisId;
			});
		}

		newPatientLevelPrediction () {
			// The PatientLevelPredictionAnalysis module is pretty big - use the setTimeout({}, 0) 
			// to allow the event loop to catch up.
			// http://stackoverflow.com/questions/779379/why-is-settimeoutfn-0-sometimes-useful
			setTimeout(() => {
				this.loading(false);
				this.currentPlpAnalysis(new PatientLevelPredictionAnalysis());
				setTimeout(() => {
					this.patientLevelPredictionDirtyFlag(new ohdsiUtil.dirtyFlag(this.currentPlpAnalysis()));
				}, 0);
			}, 0);
		}

		loadPatientLevelPrediction () {
			plpService.getPlp(this.patientLevelPredictionId()).then(({ data: plp }) => {
				this.loading(false);
				this.currentPlpAnalysis(new PatientLevelPredictionAnalysis(plp));
				setTimeout(() => {
					this.patientLevelPredictionDirtyFlag(new ohdsiUtil.dirtyFlag(this.currentPlpAnalysis()));
				}, 0);
			});
		}
	}

	return commonUtils.build('plp-manager', PlpManager, view);
});
