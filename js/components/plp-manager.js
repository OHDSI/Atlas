define(['knockout',
	'jquery',
	'text!./plp-manager.html',
	'appConfig',
	'd3',
	'ohdsi.util',
	'plp/PatientLevelPredictionAnalysis',
	'webapi/PatientLevelPredictionAPI',
	'webapi/ExecutionAPI',
	'webapi/AuthAPI',
	'clipboard',
	'atlas-state',
	'services/JobDetailsService'],
	function (ko,
						$,
						view,
						config,
						d3,
						ohdsiUtil,
						PatientLevelPredictionAnalysis,
						plpAPI,
						executionAPI,
						authAPI,
						clipboard,
						sharedState,
						jobDetailsService) {
	function plpManager(params) {
		//console.log("manager:" + params.model.currentModelId());
		var self = this;
		var authApi = params.model.authApi;

		self.patientLevelPredictionId = params.currentPatientLevelPredictionId;
		self.patientLevelPrediction = params.currentPatientLevelPrediction;
		self.patientLevelPredictionDirtyFlag = params.dirtyFlag;
		self.loading = ko.observable(true);
		self.tabMode = ko.observable('specification');
		self.config = config;
		self.performanceTabMode = ko.observable('discrimination');
		self.expressionMode = ko.observable('print');

    self.sources = ko.observableArray();
    self.sourceHistoryDisplay = {};
    self.sourceProcessingStatus = {};
    self.sourceExecutions = {};

    var initSources = sharedState.sources().filter(s => s.hasCDM);
    for (var i = 0; i < initSources.length; i++) {
      self.sourceHistoryDisplay[initSources[i].sourceKey] = ko.observable(false);
      self.sourceProcessingStatus[initSources[i].sourceKey] = ko.observable(false);
    }
    self.sources(initSources);

    self.loadExecutions = function () {
      // reset before load
      $.each(self.sources(), function (i, s) {
        if (!self.sourceExecutions[s.sourceKey]) {
          self.sourceExecutions[s.sourceKey] = ko.observableArray();
        } else {
          self.sourceExecutions[s.sourceKey].removeAll();
        }

        executionAPI.loadExecutions('PLP', self.patientLevelPredictionId(), function(exec){
          var source = self.sources().find(s => s.sourceId == exec.sourceId);
          if (source) {
              var sourceKey = source.sourceKey;
              self.sourceProcessingStatus[sourceKey](exec.executionStatus !== 'COMPLETED' && exec.executionStatus !== 'FAILED');
              self.sourceExecutions[sourceKey].remove(e => e.id === exec.id);
              self.sourceExecutions[sourceKey].push(exec);
          }
        });
      });
    };
    self.loadExecutions();

    self.monitorEEJobExecution = function (jobExecutionId, wait) {
      setTimeout(function () {
        ohdsiUtil.cachedAjax({
          url: config.api.url + 'executionservice/execution/status/' + jobExecutionId,
          method: 'GET',
          error: authAPI.handleAccessDenied,
          success: function (d) {
            self.loadExecutions();
            if (d !== 'COMPLETED' && d !== 'FAILED') {
              self.monitorEEJobExecution(jobExecutionId, 6000);
            }
          }
        });
      }, wait);
    };

    self.executePLP = function (sourceKey) {
      if (config.useExecutionEngine) {
        self.sourceProcessingStatus[sourceKey](true);
        executionAPI.runExecution(sourceKey, self.patientLevelPredictionId(), 'PLP',
          $('.language-r').text(),
          function (c, status, xhr) {
            self.monitorEEJobExecution(c.executionId, 100);
            jobDetailsService.createJob({
              name: self.patientLevelPrediction().name() + "_" + sourceKey,
              type: 'plp',
              status: 'PENDING',
              executionId: c.executionId,
              statusUrl: `${self.config.api.url}executionservice/execution/status/${c.executionId}`,
              statusValue: 'status',
              viewed: false,
              url: 'plp/' + self.patientLevelPredictionId(),
            })
          });
      }
    };

    self.viewLastExecution = function (source) {
      var executionCount = self.sourceExecutions[source.sourceKey]().length - 1;
      for (var e = executionCount; e >= 0; e--) {
        var execution = self.sourceExecutions[source.sourceKey]()[e];
        if (execution.executionStatus === 'COMPLETED' || execution.executionStatus === 'FAILED') {
          self.executionSelected(execution);
          break;
        }
      }
    };

    self.executionSelected = function (execution) {
      if(config.useExecutionEngine){
        executionAPI.viewResults(execution.id);
      }
    };

    self.toggleHistoryDisplay = function (sourceKey) {
      self.sourceHistoryDisplay[sourceKey](!self.sourceHistoryDisplay[sourceKey]());
    };


    self.copyToClipboard = function (element) {
			var currentClipboard = new clipboard('#btnCopyToClipboard');

			currentClipboard.on('success', function (e) {
				console.log('Copied to clipboard');
				e.clearSelection();
				$('#copyToClipboardMessage').fadeIn();
				setTimeout(function () {
					$('#copyToClipboardMessage').fadeOut();
				}, 1500);
			});

			currentClipboard.on('error', function (e) {
				console.log('Error copying to clipboard');
				console.log(e);
			});
		}

		self.canSave = ko.pureComputed(function () {
			return (self.patientLevelPrediction().name() && self.patientLevelPrediction().treatmentId() && self.patientLevelPrediction().treatmentId() > 0 && self.patientLevelPrediction().outcomeId() && self.patientLevelPrediction().outcomeId() > 0 && self.patientLevelPrediction().modelType && self.patientLevelPrediction().modelType() > 0 && self.patientLevelPredictionDirtyFlag() && self.patientLevelPredictionDirtyFlag().isDirty());
		});

		self.canDelete = ko.pureComputed(function () {
			return (self.patientLevelPredictionId() && self.patientLevelPredictionId() > 0);
		});

		self.delete = function () {
			if (!confirm("Delete estimation specification? Warning: deletion can not be undone!"))
				return;

			plpAPI.deletePlp(self.patientLevelPredictionId()).then(function () {
				self.patientLevelPrediction(null);
				self.patientLevelPredictionId(null);
				self.patientLevelPredictionDirtyFlag(new ohdsiUtil.dirtyFlag(self.patientLevelPrediction()));
				document.location = "#/plp"
			}, function (err) {
				console.log("Error during delete");
			});
		}

		self.save = function () {
			var plpAnalysis = {
				analysisId: self.patientLevelPrediction().analysisId || null,
				name: self.patientLevelPrediction().name(),
				treatmentId: self.patientLevelPrediction().treatmentId(),
				outcomeId: self.patientLevelPrediction().outcomeId(),
				modelType: self.patientLevelPrediction().modelType(),
				timeAtRiskStart: self.patientLevelPrediction().timeAtRiskStart(),
				timeAtRiskEnd: self.patientLevelPrediction().timeAtRiskEnd(),
				addExposureDaysToEnd: self.patientLevelPrediction().addExposureDaysToEnd(),
				minimumWashoutPeriod: self.patientLevelPrediction().minimumWashoutPeriod(),
				minimumDaysAtRisk: self.patientLevelPrediction().minimumDaysAtRisk(),
				requireTimeAtRisk: self.patientLevelPrediction().requireTimeAtRisk(),
				minTimeAtRisk: self.patientLevelPrediction().minTimeAtRisk(),
				sample: self.patientLevelPrediction().sample(),
				sampleSize: self.patientLevelPrediction().sampleSize(),
				firstExposureOnly: self.patientLevelPrediction().firstExposureOnly(),
				includeAllOutcomes: self.patientLevelPrediction().includeAllOutcomes(),
				rmPriorOutcomes: self.patientLevelPrediction().rmPriorOutcomes(),
				priorOutcomeLookback: self.patientLevelPrediction().priorOutcomeLookback(),
				testSplit: self.patientLevelPrediction().testSplit(),
				testFraction: self.patientLevelPrediction().testFraction(),
				nFold: self.patientLevelPrediction().nFold(),
				moAlpha: self.patientLevelPrediction().moAlpha(),
				moClassWeight: self.patientLevelPrediction().moClassWeight(),
				moIndexFolder: self.patientLevelPrediction().moIndexFolder(),
				moK: self.patientLevelPrediction().moK(),
				moLearnRate: self.patientLevelPrediction().moLearnRate(),
				moLearningRate: self.patientLevelPrediction().moLearningRate(),
				moMaxDepth: self.patientLevelPrediction().moMaxDepth(),
				moMinImpuritySplit: self.patientLevelPrediction().moMinImpuritySplit(),
				moMinRows: self.patientLevelPrediction().moMinRows(),
				moMinSamplesLeaf: self.patientLevelPrediction().moMinSamplesLeaf(),
				moMinSamplesSplit: self.patientLevelPrediction().moMinSamplesSplit(),
				moMTries: self.patientLevelPrediction().moMTries(),
				moNEstimators: self.patientLevelPrediction().moNEstimators(),
				moNThread: self.patientLevelPrediction().moNThread(),
				moNTrees: self.patientLevelPrediction().moNTrees(),
				moPlot: self.patientLevelPrediction().moPlot(),
				moSeed: self.patientLevelPrediction().moSeed(),
				moSize: self.patientLevelPrediction().moSize(),
				moVariance: self.patientLevelPrediction().moVariance(),
				moVarImp: self.patientLevelPrediction().moVarImp(),
				cvExclusionId: self.patientLevelPrediction().cvExclusionId(),
				cvInclusionId: self.patientLevelPrediction().cvInclusionId(),
				cvDemographics: self.patientLevelPrediction().cvDemographics() | 0,
				cvDemographicsGender: self.patientLevelPrediction().cvDemographicsGender() | 0,
				cvDemographicsRace: self.patientLevelPrediction().cvDemographicsRace() | 0,
				cvDemographicsEthnicity: self.patientLevelPrediction().cvDemographicsEthnicity() | 0,
				cvDemographicsAge: self.patientLevelPrediction().cvDemographicsAge() | 0,
				cvDemographicsYear: self.patientLevelPrediction().cvDemographicsYear() | 0,
				cvDemographicsMonth: self.patientLevelPrediction().cvDemographicsMonth() | 0,
				cvConditionOcc: self.patientLevelPrediction().cvConditionOcc() | 0,
				cvConditionOcc365d: self.patientLevelPrediction().cvConditionOcc365d() | 0,
				cvConditionOcc30d: self.patientLevelPrediction().cvConditionOcc30d() | 0,
				cvConditionOccInpt180d: self.patientLevelPrediction().cvConditionOccInpt180d() | 0,
				cvConditionEra: self.patientLevelPrediction().cvConditionEra() | 0,
				cvConditionEraEver: self.patientLevelPrediction().cvConditionEraEver() | 0,
				cvConditionEraOverlap: self.patientLevelPrediction().cvConditionEraOverlap() | 0,
				cvConditionGroup: self.patientLevelPrediction().cvConditionGroup() | 0,
				cvConditionGroupMeddra: self.patientLevelPrediction().cvConditionGroupMeddra() | 0,
				cvConditionGroupSnomed: self.patientLevelPrediction().cvConditionGroupSnomed() | 0,
				cvDrugExposure: self.patientLevelPrediction().cvDrugExposure() | 0,
				cvDrugExposure365d: self.patientLevelPrediction().cvDrugExposure365d() | 0,
				cvDrugExposure30d: self.patientLevelPrediction().cvDrugExposure30d() | 0,
				cvDrugEra: self.patientLevelPrediction().cvDrugEra() | 0,
				cvDrugEra365d: self.patientLevelPrediction().cvDrugEra365d() | 0,
				cvDrugEra30d: self.patientLevelPrediction().cvDrugEra30d() | 0,
				cvDrugEraOverlap: self.patientLevelPrediction().cvDrugEraOverlap() | 0,
				cvDrugEraEver: self.patientLevelPrediction().cvDrugEraEver() | 0,
				cvDrugGroup: self.patientLevelPrediction().cvDrugGroup() | 0,
				cvProcedureOcc: self.patientLevelPrediction().cvProcedureOcc() | 0,
				cvProcedureOcc365d: self.patientLevelPrediction().cvProcedureOcc365d() | 0,
				cvProcedureOcc30d: self.patientLevelPrediction().cvProcedureOcc30d() | 0,
				cvProcedureGroup: self.patientLevelPrediction().cvProcedureGroup() | 0,
				cvObservation: self.patientLevelPrediction().cvObservation() | 0,
				cvObservation365d: self.patientLevelPrediction().cvObservation365d() | 0,
				cvObservation30d: self.patientLevelPrediction().cvObservation30d() | 0,
				cvObservationCount365d: self.patientLevelPrediction().cvObservationCount365d() | 0,
				cvMeasurement: self.patientLevelPrediction().cvMeasurement() | 0,
				cvMeasurement365d: self.patientLevelPrediction().cvMeasurement365d() | 0,
				cvMeasurement30d: self.patientLevelPrediction().cvMeasurement30d() | 0,
				cvMeasurementCount365d: self.patientLevelPrediction().cvMeasurementCount365d() | 0,
				cvMeasurementBelow: self.patientLevelPrediction().cvMeasurementBelow() | 0,
				cvMeasurementAbove: self.patientLevelPrediction().cvMeasurementAbove() | 0,
				cvConceptCounts: self.patientLevelPrediction().cvConceptCounts() | 0,
				cvRiskScores: self.patientLevelPrediction().cvRiskScores() | 0,
				cvRiskScoresCharlson: self.patientLevelPrediction().cvRiskScoresCharlson() | 0,
				cvRiskScoresDcsi: self.patientLevelPrediction().cvRiskScoresDcsi() | 0,
				cvRiskScoresChads2: self.patientLevelPrediction().cvRiskScoresChads2() | 0,
				cvRiskScoresChads2vasc: self.patientLevelPrediction().cvRiskScoresChads2vasc() | 0,
				cvInteractionYear: self.patientLevelPrediction().cvInteractionYear() | 0,
				cvInteractionMonth: self.patientLevelPrediction().cvInteractionMonth() | 0,
				delCovariatesSmallCount: self.patientLevelPrediction().delCovariatesSmallCount(),
			};

			plpAPI.savePlp(plpAnalysis).then(function (saveResult) {
				var redirectWhenComplete = saveResult.analysisId != self.patientLevelPrediction().analysisId;
				self.patientLevelPredictionId(saveResult.analysisId);
				self.patientLevelPrediction().analysisId = saveResult.analysisId;
				if (redirectWhenComplete) {
					document.location = "#/plp/" + self.patientLevelPredictionId();
				}
				self.patientLevelPredictionDirtyFlag().reset();
				self.patientLevelPrediction.valueHasMutated();
				console.log(saveResult);
			});
		}

		self.close = function () {
			if (self.patientLevelPredictionDirtyFlag().isDirty() && !confirm("Patient level prediction changes are not saved. Would you like to continue?")) {
				return;
			}
			self.patientLevelPrediction(null);
			self.patientLevelPredictionId(null);
			self.patientLevelPredictionDirtyFlag(new ohdsiUtil.dirtyFlag(self.patientLevelPrediction()));
			document.location = '#/plp';
		}

		self.copy = function () {
			plpAPI.copyPlp(self.patientLevelPredictionId()).then(function (result) {
				document.location = "#/plp/" + result.analysisId;
			});
		}


		self.newPatientLevelPrediction = function () {
			// The PatientLevelPredictionAnalysis module is pretty big - use the setTimeout({}, 0) 
			// to allow the event loop to catch up.
			// http://stackoverflow.com/questions/779379/why-is-settimeoutfn-0-sometimes-useful
			setTimeout(function () {
				self.loading(false);
				self.patientLevelPrediction(new PatientLevelPredictionAnalysis());
				setTimeout(function () {
					self.patientLevelPredictionDirtyFlag(new ohdsiUtil.dirtyFlag(self.patientLevelPrediction()));
				}, 0);
			}, 0);
		}

		self.loadPatientLevelPrediction = function () {
			plpAPI.getPlp(self.patientLevelPredictionId()).then(function (plp) {
				setTimeout(function () {
					self.loading(false);
					self.patientLevelPrediction(new PatientLevelPredictionAnalysis(plp));
					setTimeout(function () {
						self.patientLevelPredictionDirtyFlag(new ohdsiUtil.dirtyFlag(self.patientLevelPrediction()));
					}, 0);
				}, 0);
			})
		}

		// startup actions
		if (self.patientLevelPredictionId() == 0 && self.patientLevelPrediction() == null) {
			self.newPatientLevelPrediction();
		} else if (self.patientLevelPredictionId() > 0 && self.patientLevelPredictionId() != (self.patientLevelPrediction() && self.patientLevelPrediction().analysisId)) {
			self.loadPatientLevelPrediction();
		} else {
			// already loaded
			self.loading(false);
		}
	}

	var component = {
		viewModel: plpManager,
		template: view
	};

	ko.components.register('plp-manager', component);
	return component;

});
