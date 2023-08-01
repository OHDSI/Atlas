define([
	'knockout',
	'text!./prediction-manager.html',
	'pages/Page',
	'pages/Router',
	'utils/CommonUtils',
	'assets/ohdsi.util',
        'appConfig',
	'./const',
	'const',
	'atlas-state',
	'./PermissionService',
	'services/Permission',
	'components/security/access/const',
	'services/Prediction',
	'services/analysis/Cohort',
	'./inputTypes/PatientLevelPredictionAnalysis',
	'featureextraction/InputTypes/CovariateSettings',
	'featureextraction/InputTypes/TemporalCovariateSettings',
	'services/analysis/ConceptSet',
	'services/analysis/ConceptSetCrossReference',
	'services/AuthAPI',
	'services/Poll',
	'lodash',
	'services/FeatureExtraction',
	'featureextraction/components/covariate-settings-editor',
	'featureextraction/components/temporal-covariate-settings-editor',
	'components/entityBrowsers/cohort-definition-browser',
	'faceted-datatable',
    'components/tabs',
	'./components/prediction-specification-view-edit',
	'./components/prediction-utilities',
	'less!./prediction-manager.less',
	'components/security/access/configure-access-modal',
	'databindings',
	'components/checks/warnings',
	'components/heading',
	'components/authorship',
	'components/name-validation',
], function (
	ko,
	view,
	Page,
	router,
	commonUtils,
	ohdsiUtil,
	config,
	constants,
	globalConstants,
	sharedState,
	PermissionService,
	GlobalPermissionService,
	{ entityType },
	PredictionService,
	Cohort,
	PatientLevelPredictionAnalysis,
	CovariateSettings,
	TemporalCovariateSettings,
	ConceptSet,
	ConceptSetCrossReference,
	authAPI,
	{PollService},
	lodash
) {
	const NOT_FOUND = 'NOT FOUND';

	class PatientLevelPredictionManager extends Page {
		constructor(params) {
			super(params);
			sharedState.predictionAnalysis.analysisPath = constants.paths.analysis;

			this.selectTab = this.selectTab.bind(this);
			this.selectedTabKey = ko.observable(router.routerParams().section);

			this.isAuthenticated = ko.pureComputed(() => {
				return authAPI.isAuthenticated();
			});
			this.isViewPermitted = ko.pureComputed(() => {
				return authAPI.isPermittedReadPlps();
			});

			this.options = constants.options;
			this.config = config;
			this.enablePermissionManagement = config.enablePermissionManagement;
			this.loading = ko.observable(true);
			this.patientLevelPredictionAnalysis = sharedState.predictionAnalysis.current;
			this.selectedAnalysisId = sharedState.predictionAnalysis.selectedId;
			this.dirtyFlag = sharedState.predictionAnalysis.dirtyFlag;
			this.managerMode = ko.observable('summary');
			this.tabMode = ko.observable('specification');
			this.utilityPillMode = ko.observable('download');
			this.targetCohorts = sharedState.predictionAnalysis.targetCohorts;
			this.outcomeCohorts = sharedState.predictionAnalysis.outcomeCohorts;
			this.fullAnalysisList = ko.observableArray();
			this.defaultTemporalCovariateSettings = null;
			this.fullSpecification = ko.observable(null);
			this.packageName = ko.observable().extend({alphaNumeric: null});
			this.isSaving = ko.observable(false);
			this.isCopying = ko.observable(false);
			this.isDeleting = ko.observable(false);
			this.executionTabTitle = config.useExecutionEngine ? "Executions" : "";
			this.isProcessing = ko.computed(() => {
				return this.isSaving() || this.isCopying() || this.isDeleting();
			});
			this.defaultName = ko.unwrap(globalConstants.newEntityNames.plp);
			this.canEdit = ko.pureComputed(() => parseInt(this.selectedAnalysisId()) ? PermissionService.isPermittedUpdate(this.selectedAnalysisId()) : PermissionService.isPermittedCreate());

			this.canDelete = ko.pureComputed(() => {
				return PermissionService.isPermittedDelete(this.selectedAnalysisId());
			});

			this.canCopy = ko.pureComputed(() => {
				return PermissionService.isPermittedCopy(this.selectedAnalysisId());
			});

			this.isNewEntity = this.isNewEntityResolver();
			this.predictionCaption = ko.computed(() => {
				if (this.patientLevelPredictionAnalysis()) {
					if (this.selectedAnalysisId() === '0') {
						return ko.unwrap(ko.i18n('predictions.newItem', 'New Patient Level Prediction'));
					} else {
						return ko.unwrap(ko.i18nformat('predictions.itemId', 'Patient Level Prediction #<%=id%>', {id: this.selectedAnalysisId()}));
					}
				}
			});

			this.isNameFilled = ko.computed(() => {
				return this.patientLevelPredictionAnalysis() && this.patientLevelPredictionAnalysis().name() && this.patientLevelPredictionAnalysis().name().trim();
			});
			this.isNameCharactersValid = ko.computed(() => {
				return this.isNameFilled() && commonUtils.isNameCharactersValid(this.patientLevelPredictionAnalysis().name());
			});
			this.isNameLengthValid = ko.computed(() => {
				return this.isNameFilled() && commonUtils.isNameLengthValid(this.patientLevelPredictionAnalysis().name());
			});
			this.isDefaultName = ko.computed(() => {
				return this.isNameFilled() && this.patientLevelPredictionAnalysis().name().trim() === this.defaultName;
			});
			this.isNameCorrect = ko.computed(() => {
				return this.isNameFilled() && !this.isDefaultName() && this.isNameCharactersValid() && this.isNameLengthValid();
			});

			this.canSave = ko.computed(() => {
				return this.dirtyFlag().isDirty() && this.isNameCorrect() && this.canEdit();
			});

			this.selectedSourceId = ko.observable(router.routerParams().sourceId);

			this.criticalCount = ko.observable(0);
			this.isDiagnosticsRunning = ko.observable(false);

			const extraExecutionPermissions = ko.computed(() => !this.dirtyFlag().isDirty()
				&& config.api.isExecutionEngineAvailable()
				&& this.canEdit()
				&& this.criticalCount() <= 0);

			const generationDisableReason = ko.computed(() => {
				if (this.dirtyFlag().isDirty()) return ko.unwrap(globalConstants.disabledReasons.DIRTY);
				if (this.criticalCount() > 0) return ko.unwrap(globalConstants.disabledReasons.INVALID_DESIGN);
				if (!config.api.isExecutionEngineAvailable()) return ko.unwrap(globalConstants.disabledReasons.ENGINE_NOT_AVAILABLE);
				return ko.unwrap(globalConstants.disabledReasons.ACCESS_DENIED);
			});
			this.componentParams = ko.observable({
				analysisId: this.selectedAnalysisId,
				patientLevelPredictionAnalysis: sharedState.predictionAnalysis.current,
				targetCohorts: sharedState.predictionAnalysis.targetCohorts,
				outcomeCohorts: sharedState.predictionAnalysis.outcomeCohorts,
				dirtyFlag: sharedState.predictionAnalysis.dirtyFlag,
				fullAnalysisList: this.fullAnalysisList,
				packageName: this.packageName,
				fullSpecification: this.fullSpecification,
				loading: this.loading,
				subscriptions: this.subscriptions,
				isEditPermitted: this.canEdit,
				PermissionService,
				ExecutionService: PredictionService,
				extraExecutionPermissions,
				tableColumns: ['Date', 'Status', 'Duration', 'Results'],
				executionResultMode: globalConstants.executionResultModes.DOWNLOAD,
				downloadFileName: 'prediction-analysis-results',
				downloadApiPaths: constants.apiPaths,
				runExecutionInParallel: true,
				PollService: PollService,
				selectedSourceId: this.selectedSourceId,
				generationDisableReason,
				resultsPathPrefix: '/prediction/',
				criticalCount: this.criticalCount,
				afterImportSuccess: this.afterImportSuccess.bind(this),
			});

			this.warningParams = ko.observable({
				current: sharedState.predictionAnalysis.current,
				warningsTotal: ko.observable(0),
				warningCount: ko.observable(0),
				infoCount: ko.observable(0),
				criticalCount: this.criticalCount,
				changeFlag: ko.pureComputed(() => this.dirtyFlag().isChanged()),
				isDiagnosticsRunning: this.isDiagnosticsRunning,
				onDiagnoseCallback: this.diagnose.bind(this),
				checkChangesOnly: true,
			});

			GlobalPermissionService.decorateComponent(this, {
				entityTypeGetter: () => entityType.PREDICTION,
				entityIdGetter: () => this.selectedAnalysisId(),
				createdByUsernameGetter: () => this.patientLevelPredictionAnalysis() && lodash.get(this.patientLevelPredictionAnalysis(), 'createdBy.login')
			});
		}

		onPageCreated() {
			const selectedAnalysisId = parseInt(this.selectedAnalysisId());
			if (selectedAnalysisId === 0 && !this.dirtyFlag().isDirty()) {
				this.newAnalysis();
			} else if (selectedAnalysisId > 0 && selectedAnalysisId !== (this.patientLevelPredictionAnalysis() && this.patientLevelPredictionAnalysis().id())) {
				this.onAnalysisSelected();
			} else {
				this.setAnalysisSettingsLists();
				this.loading(false);
			}
		}

		onRouterParamsChanged({ id, section, sourceId }) {
			if (section !== undefined) {
				this.selectedTabKey(section);
			}
			if (sourceId !== undefined) {
				this.selectedSourceId(sourceId);
			}
			if (id !== undefined && id !== parseInt(this.selectedAnalysisId())) {
				this.onPageCreated();
			}
		}

    selectTab(index, { key }) {
			this.selectedTabKey(key);
      return commonUtils.routeTo('/prediction/' + this.componentParams().analysisId() + '/' + key);
    }

		patientLevelPredictionAnalysisForWebAPI() {
			let definition = ko.toJS(this.patientLevelPredictionAnalysis);
			definition = ko.toJSON(definition);
			return JSON.stringify(definition);
		}

		close () {
			if (this.dirtyFlag().isDirty() && !confirm(ko.unwrap(ko.i18n('predictions.confirmChanges', 'Patient level prediction changes are not saved. Would you like to continue?')))) {
				return;
			}
			this.loading(true);
			this.patientLevelPredictionAnalysis(null);
			this.selectedAnalysisId(null);
			this.targetCohorts.removeAll();
			this.outcomeCohorts.removeAll();
			this.dirtyFlag(new ohdsiUtil.dirtyFlag(this.patientLevelPredictionAnalysis()));
			document.location = constants.paths.browser();
		}

		isNewEntityResolver() {
			return ko.computed(() => this.patientLevelPredictionAnalysis() && this.selectedAnalysisId() === '0');
		}

		diagnose() {
			if (this.patientLevelPredictionAnalysis()) {
				// do not pass modifiedBy and createdBy parameters to check
				const modifiedBy = this.patientLevelPredictionAnalysis().modifiedBy;
				this.patientLevelPredictionAnalysis().modifiedBy = null;
				const createdBy = this.patientLevelPredictionAnalysis().createdBy;
				this.patientLevelPredictionAnalysis().createdBy = null;
				const payload = this.prepForSave();
				this.patientLevelPredictionAnalysis().modifiedBy = modifiedBy;
				this.patientLevelPredictionAnalysis().createdBy = createdBy;
				return PredictionService.runDiagnostics(payload);
			}
		}

		async delete() {
			if (!confirm(ko.unwrap(ko.i18n('predictions.confirmDelete', 'Delete patient level prediction specification? Warning: deletion can not be undone!'))))
				return;

			this.isDeleting(true);
			const analysis = PredictionService.deletePrediction(this.selectedAnalysisId());

			this.loading(true);
			this.patientLevelPredictionAnalysis(null);
			this.selectedAnalysisId(null);
			this.targetCohorts.removeAll();
			this.outcomeCohorts.removeAll();
			this.dirtyFlag(new ohdsiUtil.dirtyFlag(this.patientLevelPredictionAnalysis()));
			document.location = constants.paths.browser()
		}

		copy() {
			this.isCopying(true);
			this.loading(true);
			PredictionService.copyPrediction(this.selectedAnalysisId()).then((analysis) => {
				this.loadAnalysisFromServer(analysis);
				this.isCopying(false);
				this.loading(false);
				document.location = constants.paths.analysis(this.patientLevelPredictionAnalysis().id());
			});
		}

		async save() {
			this.isSaving(true);
			this.loading(true);

			let predictionName = this.patientLevelPredictionAnalysis().name();
			this.patientLevelPredictionAnalysis().name(predictionName.trim());

			// Next check to see that a prediction analysis with this name does not already exist
			// in the database. Also pass the id so we can make sure that the current prediction analysis is excluded in this check.
			try{
				const results = await PredictionService.exists(this.patientLevelPredictionAnalysis().name(), this.patientLevelPredictionAnalysis().id() == undefined ? 0 : this.patientLevelPredictionAnalysis().id());
				if (results > 0) {
					alert(ko.unwrap(ko.i18n('predictions.confirmSave', 'A prediction analysis with this name already exists. Please choose a different name.')));
				} else {
					this.fullAnalysisList.removeAll();
					const payload = this.prepForSave();
					const savedPrediction = await PredictionService.savePrediction(payload);
					this.loadAnalysisFromServer(savedPrediction);
					document.location = constants.paths.analysis(this.patientLevelPredictionAnalysis().id());
				}
			} catch (e) {
				alert(ko.unwrap(ko.i18n('predictions.confirmCatchSave', 'An error occurred while attempting to save a prediction analysis.')));
			} finally {
				this.isSaving(false);
				this.loading(false);
            }
		}

		prepForSave() {
			const specification = ko.toJS(this.patientLevelPredictionAnalysis());

			// createdBy/modifiedBy INSIDE the spec should not be objects, just a string
			specification.createdBy = this.patientLevelPredictionAnalysis().createdBy ? this.patientLevelPredictionAnalysis().createdBy.login : null;
			specification.modifiedBy = this.patientLevelPredictionAnalysis().modifiedBy ? this.patientLevelPredictionAnalysis().modifiedBy.login : null;

			specification.targetIds = [];
			specification.outcomeIds = [];
			specification.cohortDefinitions = [];
			specification.conceptSets = [];
			specification.conceptSetCrossReference = [];
			specification.packageName = this.packageName();
			this.outcomeCohorts().forEach(o => {
				specification.outcomeIds.push(o.id);
				specification.cohortDefinitions.push(o);
			});
			this.targetCohorts().forEach(t => {
				specification.targetIds.push(t.id);
				specification.cohortDefinitions.push(t);
			});
			specification.covariateSettings.forEach((cs, index) => {
				if (cs.includedCovariateConceptSet !== null && cs.includedCovariateConceptSet.id > 0) {
					if (specification.conceptSets.filter(element => element.id === cs.includedCovariateConceptSet.id).length == 0) {
						specification.conceptSets.push(cs.includedCovariateConceptSet);
					}
					specification.conceptSetCrossReference.push(
						new ConceptSetCrossReference({
							conceptSetId: cs.includedCovariateConceptSet.id,
							targetName: constants.conceptSetCrossReference.covariateSettings.targetName,
							targetIndex: index,
							propertyName: constants.conceptSetCrossReference.covariateSettings.propertyName.includedCovariateConcepts,
						})
					);

				}
				if (cs.excludedCovariateConceptSet !== null && cs.excludedCovariateConceptSet.id > 0) {
					if (specification.conceptSets.filter(element => element.id === cs.excludedCovariateConceptSet.id).length == 0) {
						specification.conceptSets.push(cs.excludedCovariateConceptSet);
					}
					specification.conceptSetCrossReference.push(
						new ConceptSetCrossReference({
							conceptSetId: cs.excludedCovariateConceptSet.id,
							targetName: constants.conceptSetCrossReference.covariateSettings.targetName,
							targetIndex: index,
							propertyName: constants.conceptSetCrossReference.covariateSettings.propertyName.excludedCovariateConcepts,
						})
					);
				}

				specification.covariateSettings[index] = ko.toJS(new CovariateSettings(cs));
			});

			return {
				id: this.patientLevelPredictionAnalysis().id(),
				name: this.patientLevelPredictionAnalysis().name(),
				description: this.patientLevelPredictionAnalysis().description(),
				specification: ko.toJSON(specification),
			};
		}

		newAnalysis() {
			this.loading(true);
			this.patientLevelPredictionAnalysis(new PatientLevelPredictionAnalysis({id: 0, name: this.defaultName}));
			return new Promise(async (resolve, reject) => {
				this.setAnalysisSettingsLists();
				this.resetDirtyFlag();
				this.loading(false);

				resolve();
			});
		}

		onAnalysisSelected() {
			this.loading(true);
			PredictionService.getPrediction(this.selectedAnalysisId()).then((analysis) => {
				this.loadAnalysisFromServer(analysis);
				this.loading(false);
			}).catch(() => this.loading(false));
		}

		resetDirtyFlag() {
			this.dirtyFlag(new ohdsiUtil.dirtyFlag({analysis: this.patientLevelPredictionAnalysis(), targetCohorts: this.targetCohorts, outcomeCohorts: this.outcomeCohorts}));
		}

		loadAnalysisFromServer(analysis) {
			var header = analysis.json;
			var specification = JSON.parse(analysis.data.specification);
			this.loadParsedAnalysisFromServer(header, specification);
		}

		loadParsedAnalysisFromServer(header, specification) {
			this.patientLevelPredictionAnalysis(new PatientLevelPredictionAnalysis({
				...specification,
				...header,
			}));
			this.packageName(header.packageName);
			this.setUserInterfaceDependencies();
			this.setAnalysisSettingsLists();
			this.fullSpecification(null);
			this.resetDirtyFlag();
		}

		setUserInterfaceDependencies() {
			this.targetCohorts.removeAll();
			this.patientLevelPredictionAnalysis().targetIds().forEach(c => {
				let name = NOT_FOUND;
				if (this.patientLevelPredictionAnalysis().cohortDefinitions().filter(a => a.id() === parseInt(c)).length > 0) {
					name = this.patientLevelPredictionAnalysis().cohortDefinitions().filter(a => a.id() === parseInt(c))[0].name();
					this.targetCohorts.push(new Cohort({id: c, name: name}));
				}
			});

			this.outcomeCohorts.removeAll();
			this.patientLevelPredictionAnalysis().outcomeIds().forEach(c => {
				let name = NOT_FOUND;
				if (this.patientLevelPredictionAnalysis().cohortDefinitions().filter(a => a.id() === parseInt(c)).length > 0) {
					name = this.patientLevelPredictionAnalysis().cohortDefinitions().filter(a => a.id() === parseInt(c))[0].name();
					this.outcomeCohorts.push(new Cohort({id: c, name: name}));
				}
			});

			const conceptSets = this.patientLevelPredictionAnalysis().conceptSets();
			const csXref =this.patientLevelPredictionAnalysis().conceptSetCrossReference();
			csXref.forEach((xref) => {
				const selectedConceptSetList = conceptSets.filter((cs) => { return cs.id === xref.conceptSetId});
				if (selectedConceptSetList.length === 0) {
					console.error("Concept Set: " + xref.conceptSetId + " not found in specification.");
				}
				const selectedConceptSet = new ConceptSet({id: selectedConceptSetList[0].id, name: selectedConceptSetList[0].name()});
				if (xref.targetName === constants.conceptSetCrossReference.covariateSettings.targetName) {
					if (xref.propertyName === constants.conceptSetCrossReference.covariateSettings.propertyName.includedCovariateConcepts) {
						this.patientLevelPredictionAnalysis().covariateSettings()[xref.targetIndex].includedCovariateConceptSet(selectedConceptSet);
					}
					if (xref.propertyName === constants.conceptSetCrossReference.covariateSettings.propertyName.excludedCovariateConcepts) {
						this.patientLevelPredictionAnalysis().covariateSettings()[xref.targetIndex].excludedCovariateConceptSet(selectedConceptSet);
					}
				}
			});
		}

		setAnalysisSettingsLists() {
			this.covariateSettings = this.patientLevelPredictionAnalysis().covariateSettings;
			this.modelSettings = this.patientLevelPredictionAnalysis().modelSettings;
			this.populationSettings = this.patientLevelPredictionAnalysis().populationSettings;
		}

		async afterImportSuccess(res) {
			commonUtils.routeTo('/prediction/' + res.id);
		};

		getAuthorship() {
			const createdDate = commonUtils.formatDateForAuthorship(this.patientLevelPredictionAnalysis().createdDate);
			const modifiedDate = commonUtils.formatDateForAuthorship(this.patientLevelPredictionAnalysis().modifiedDate);
			return {
					createdBy: lodash.get(this.patientLevelPredictionAnalysis(), 'createdBy.name'),
					createdDate,
					modifiedBy: lodash.get(this.patientLevelPredictionAnalysis(), 'modifiedBy.name'),
					modifiedDate,
			}
		}
	}

	return commonUtils.build('prediction-manager', PatientLevelPredictionManager, view);
});
