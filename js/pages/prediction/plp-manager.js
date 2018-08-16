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
			this.curentPlpAnalysis = params.currentPatientLevelPrediction;
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
					this.curentPlpAnalysis().name()
					&& this.curentPlpAnalysis().treatmentId()
					&& this.curentPlpAnalysis().treatmentId() > 0
					&& this.curentPlpAnalysis().outcomeId()
					&& this.curentPlpAnalysis().outcomeId() > 0
					&& this.curentPlpAnalysis().modelType
					&& this.curentPlpAnalysis().modelType() > 0
					&& this.patientLevelPredictionDirtyFlag()
					&& this.patientLevelPredictionDirtyFlag().isDirty());
			});

			this.canDelete = ko.pureComputed(() => {
				return (
					this.patientLevelPredictionId()
					&& this.patientLevelPredictionId() > 0
				);
			});
			this.plpResultsEnabled = config.plpResultsEnabled;
			this.isExecutionEngineAvailable = config.api.isExecutionEngineAvailable;
			this.useExecutionEngine = config.useExecutionEngine;
			
			// startup actions
			if (this.patientLevelPredictionId() == 0 && this.curentPlpAnalysis() == null) {
				this.newPatientLevelPrediction();
			} else if (this.patientLevelPredictionId() > 0 && this.patientLevelPredictionId() != (this.curentPlpAnalysis() && this.curentPlpAnalysis().analysisId)) {
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
							name: this.curentPlpAnalysis().name() + "_" + sourceKey,
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
				this.curentPlpAnalysis(null);
				this.patientLevelPredictionId(null);
				this.patientLevelPredictionDirtyFlag(new ohdsiUtil.dirtyFlag(this.curentPlpAnalysis()));
				document.location = "#/plp"
			}, function (err) {
				console.log("Error during delete", err);
			});
		}

		save () {
			plpService.savePlp(this.curentPlpAnalysis()).then(({ data: saveResult }) => {
				const redirectWhenComplete = saveResult.analysisId != this.curentPlpAnalysis().analysisId;
				this.patientLevelPredictionId(saveResult.analysisId);
				this.curentPlpAnalysis().analysisId = saveResult.analysisId;
				if (redirectWhenComplete) {
					document.location = "#/plp/" + this.patientLevelPredictionId();
				}
				this.patientLevelPredictionDirtyFlag().reset();
				this.patientLevelPrediction.valueHasMutated();
			});
		}

		close () {
			if (this.patientLevelPredictionDirtyFlag().isDirty() && !confirm("Patient level prediction changes are not saved. Would you like to continue?")) {
				return;
			}
			this.curentPlpAnalysis(null);
			this.patientLevelPredictionId(null);
			this.patientLevelPredictionDirtyFlag(new ohdsiUtil.dirtyFlag(this.curentPlpAnalysis()));
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
				this.curentPlpAnalysis(new PatientLevelPredictionAnalysis());
				setTimeout(() => {
					this.patientLevelPredictionDirtyFlag(new ohdsiUtil.dirtyFlag(this.curentPlpAnalysis()));
				}, 0);
			}, 0);
		}

		loadPatientLevelPrediction () {
			plpService.getPlp(this.patientLevelPredictionId()).then(({ data: plp }) => {
				this.loading(false);
				this.curentPlpAnalysis(new PatientLevelPredictionAnalysis(plp));
				this.patientLevelPredictionDirtyFlag(new ohdsiUtil.dirtyFlag(this.curentPlpAnalysis()));
			});
		}
	}

	return commonUtils.build('plp-manager', PlpManager, view);
});
