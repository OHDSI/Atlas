define([
	'knockout',
	'text!./ir-manager.html',
	'services/IRAnalysis',
	'services/SourceAPI',
	'services/CohortDefinition',
	'./components/iranalysis/IRAnalysisDefinition',
	'./components/iranalysis/IRAnalysisExpression',
	'assets/ohdsi.util',
	'appConfig',
	'atlas-state',
	'services/JobDetailsService',
	'services/job/jobDetail',
	'services/AuthAPI',
	'services/file',
	'services/JobPollService',
	'./PermissionService',
	'services/Permission',
	'services/Tags',
	'components/security/access/const',
	'pages/Page',
	'utils/AutoBind',
	'utils/CommonUtils',
	'utils/ExceptionUtils',
	'components/conceptset/ConceptSetStore',
	'components/conceptset/utils',
	'./const',
	'const',
	'components/checks/warnings',
	'components/checks/warnings-badge',
	'./components/iranalysis/main',
	'./components/iranalysis/components/ir-conceptset',
	'databindings',
	'circe',
	'components/heading',
	'utilities/import',
	'utilities/export',
	'utilities/sql',
	'components/security/access/configure-access-modal',
	'components/tags/modal/tags-modal',
	'components/name-validation',
	'less!./ir-manager.less',
	'components/authorship',
	'components/versions/versions'
], function (
	ko,
	view,
	IRAnalysisService,
	sourceAPI,
	cohortAPI,
	IRAnalysisDefinition,
	IRAnalysisExpression,
	ohdsiUtil,
	config,
	sharedState,
	jobDetailsService,
	jobDetail,
	authAPI,
	FileService,
	JobPollService,
	{ isPermittedExportSQL },
	GlobalPermissionService,
	TagsService,
	{ entityType },
	Page,
	AutoBind,
	commonUtils,
	exceptionUtils,
	ConceptSetStore,
	conceptSetUtils,
	constants,
	globalConstants,
) {
	class IRAnalysisManager extends AutoBind(Page) {
		constructor(params) {
			super(params);
			// polling support
			this.pollId = null;
			this.loading = ko.observable(false);
			this.loadingInfo = ko.observable();
			this.loadingSummary = ko.observableArray();
			this.constants = constants;
			this.tabs = constants.tabs;
			this.selectedAnalysis = sharedState.IRAnalysis.current;
			this.selectedAnalysisId = sharedState.IRAnalysis.selectedId;
			this.previewVersion = sharedState.IRAnalysis.previewVersion;
			this.dirtyFlag = sharedState.IRAnalysis.dirtyFlag;
			this.enablePermissionManagement = config.enablePermissionManagement;	 
			this.exporting = ko.observable();
			this.isAuthenticated = ko.pureComputed(() => {
				return authAPI.isAuthenticated();
			});
			this.defaultName = ko.unwrap(globalConstants.newEntityNames.incidenceRate);
			this.conceptSetStore = ConceptSetStore.getStore(ConceptSetStore.sourceKeys().incidenceRates);
			this.isViewPermitted = ko.pureComputed(() => {
				return !config.userAuthenticationEnabled
					|| (
						config.userAuthenticationEnabled
						&& authAPI.isPermittedReadIRs()
					)
			});
			this.canCreate = ko.pureComputed(() => {
				return !config.userAuthenticationEnabled
				|| (
					config.userAuthenticationEnabled
					&& authAPI.isPermittedCreateIR()
				)
			});
			this.isDeletable = ko.pureComputed(() => {
				return !config.userAuthenticationEnabled
					|| (
						config.userAuthenticationEnabled
						&& authAPI.isPermittedDeleteIR(this.selectedAnalysisId())
					)
			});
			this.isEditable = ko.pureComputed(() => {
				return this.selectedAnalysisId() === null || this.selectedAnalysisId() === 0
					|| !config.userAuthenticationEnabled
					|| (
						config.userAuthenticationEnabled
						&& authAPI.isPermittedEditIR(this.selectedAnalysisId())
					)
			});
			this.canCopy = ko.pureComputed(() => {
				return !config.userAuthenticationEnabled
					|| (
						config.userAuthenticationEnabled
						&& authAPI.isPermittedCopyIR(this.selectedAnalysisId())
						&& !this.dirtyFlag().isDirty()
					)
			});
			this.isPermittedExportSQL = isPermittedExportSQL;
			this.selectedAnalysisId.subscribe((id) => {
				if (config.userAuthenticationEnabled && authAPI.isAuthenticated) {
					authAPI.loadUserInfo();
				}
			});

			this.isRunning = ko.observable(false);
			this.activeTab = ko.observable(params.activeTab || this.tabs.DEFINITION);
			this.sources = ko.observableArray();
			this.stoppingSources = ko.observable({});

			this.cohortDefs = ko.observableArray();
			this.analysisCohorts = ko.pureComputed(() => {
				var analysisCohorts = {targetCohorts: ko.observableArray(), outcomeCohorts: ko.observableArray()};
				if (this.selectedAnalysis()) {
					analysisCohorts.targetCohorts(this.selectedAnalysis().expression().targetIds().map((targetId) => {
						return ({id: targetId, name: this.resolveCohortId(targetId)});
					}));

					analysisCohorts.outcomeCohorts(this.selectedAnalysis().expression().outcomeIds().map((outcomeId) => {
						return ({id: outcomeId, name: this.resolveCohortId(outcomeId)});
					}));
				}
				return analysisCohorts;
			});
			this.showConceptSetBrowser = ko.observable(false);
			this.criteriaContext = ko.observable();
			this.generateActionsSettings = {
				selectText: "Generate...",
				width: 100,
				actionOptions: null,  // initalized in the startup actions
				onAction: function (data) {
					data.selectedData.action();
				}
			};
			this.incidenceRateCaption = ko.computed(() => {
				if (this.selectedAnalysis() && this.selectedAnalysisId() !== null && this.selectedAnalysisId() !== 0) {
					if (this.previewVersion()) {
						return ko.i18nformat('ir.captionPreview', 'Incidence Rate Analysis #<%=id%> - Version <%=number%> Preview', {id: this.selectedAnalysisId(), number: this.previewVersion().version})();
					} else {
						return ko.i18nformat('ir.caption', 'Incidence Rate Analysis #<%=id%>', {id: this.selectedAnalysisId()})();
					}
				}
				return this.defaultName;
			});

			this.expressionMode = ko.observable('import');

			this.isNameFilled = ko.pureComputed(() => {
				return this.selectedAnalysis() && this.selectedAnalysis().name() && this.selectedAnalysis().name().trim();
			});
			this.isNameCharactersValid = ko.computed(() => {
				return this.isNameFilled() && commonUtils.isNameCharactersValid(this.selectedAnalysis().name());
			});
			this.isNameLengthValid = ko.computed(() => {
				return this.isNameFilled() && commonUtils.isNameLengthValid(this.selectedAnalysis().name());
			});
			this.isDefaultName = ko.computed(() => {
				return this.isNameFilled() && this.selectedAnalysis().name().trim() === this.defaultName;
			});

			this.isNameCorrect = ko.pureComputed(() => {
				return this.isNameFilled() && !this.isDefaultName() && this.isNameCharactersValid() && this.isNameLengthValid();
			});

			this.isTarValid = ko.pureComputed(() => {
				const analysis = this.selectedAnalysis() && this.selectedAnalysis().expression();
				if (analysis == null) return;
				return !(analysis.timeAtRisk.start.DateField() == analysis.timeAtRisk.end.DateField() && analysis.timeAtRisk.end.Offset() <= analysis.timeAtRisk.start.Offset());			});

			this.canSave = ko.pureComputed(() => {
				return this.isEditable()
					&& this.isNameCorrect()
					&& (this.dirtyFlag().isDirty() || this.previewVersion())
					&& !this.isRunning();
			});
			this.error = ko.observable();
			this.isSaving = ko.observable(false);
			this.isCopying = ko.observable(false);
			this.isDeleting = ko.observable(false);
			this.isProcessing = ko.computed(() => {
				return this.isSaving() || this.isCopying() || this.isDeleting();
			});

			this.exportService = IRAnalysisService.exportAnalysis;
			this.importService = IRAnalysisService.importAnalysis;
			this.exportSqlService = this.exportSql;
			this.criticalCount = ko.observable(0);
			this.isDiagnosticsRunning = ko.observable(false);

			this.warningParams = ko.observable({
				current: this.selectedAnalysis,
				warningsTotal: ko.observable(0),
				warningCount: ko.observable(0),
				infoCount: ko.observable(0),
				criticalCount: this.criticalCount,
				changeFlag: ko.pureComputed(() => this.dirtyFlag().isChanged()),
				isDiagnosticsRunning: this.isDiagnosticsRunning,
				onDiagnoseCallback: this.diagnose.bind(this),
				checkOnInit: !this.selectedAnalysis(),
			});

			this.isDesignCorrect = ko.pureComputed(() => this.criticalCount() === 0);

			GlobalPermissionService.decorateComponent(this, {
				entityTypeGetter: () => entityType.INCIDENCE_RATE,
				entityIdGetter: () => this.selectedAnalysisId(),
				createdByUsernameGetter: () => this.selectedAnalysis() && this.selectedAnalysis().createdBy()
					&& this.selectedAnalysis().createdBy().login
			});

			this.tags = ko.observableArray();
			TagsService.decorateComponent(this, {
				assetTypeGetter: () => TagsService.ASSET_TYPE.INCIDENCE_RATE,
				assetGetter: () => this.selectedAnalysis(),
				addTagToAsset: (tag) => {
					const isDirty = this.dirtyFlag().isDirty();
					this.selectedAnalysis().tags.push(tag);
					this.tags(this.selectedAnalysis().tags());
					if (!isDirty) {
						this.dirtyFlag().reset();
						this.warningParams.valueHasMutated();
					}
				},
				removeTagFromAsset: (tag) => {
					const isDirty = this.dirtyFlag().isDirty();
					this.selectedAnalysis().tags(this.selectedAnalysis().tags()
						.filter(t => t.id !== tag.id && tag.groups.filter(tg => tg.id === t.id).length === 0));
					this.tags(this.selectedAnalysis().tags());
					if (!isDirty) {
						this.dirtyFlag().reset();
						this.warningParams.valueHasMutated();
					}
				}
			});

			this.versionsParams = ko.observable({
				versionPreviewUrl: (versionNumber) => `/iranalysis/${this.selectedAnalysisId()}/version/${versionNumber}`,
				currentVersion: () => {
					return {
						...this.selectedAnalysis(),
						createdBy: this.selectedAnalysis().createdBy(),
						createdDate: this.selectedAnalysis().createdDate(),
						modifiedBy: this.selectedAnalysis().modifiedBy(),
						modifiedDate: this.selectedAnalysis().modifiedDate(),
					}
				},
				previewVersion: () => this.previewVersion(),
				getList: () => this.selectedAnalysisId() ? IRAnalysisService.getVersions(this.selectedAnalysisId()) : [],
				updateVersion: (version) => IRAnalysisService.updateVersion(version),
				copyVersion: async (version) => {
					this.isCopying(true);
					try {
						const result = await IRAnalysisService.copyVersion(this.selectedAnalysisId(), version.version);
						this.previewVersion(null);
						commonUtils.routeTo(`/iranalysis/${result.id}/definition`);
					} catch(ex) {
						alert(exceptionUtils.extractServerMessage(ex));
					} finally {
						this.isCopying(false);
					}
				},
				isAssetDirty: () => this.dirtyFlag().isDirty(),
				canAddComments: () => this.isEditable()
			});

			// startup actions
			this.init();
		}

		isPermittedImport() {
			return authAPI.isPermitted(`ir:design:post`);
		}

		isPermittedExport(id) {
			return authAPI.isPermitted(`ir:${id}:design:get`);
		}

		diagnose() {
			if (this.selectedAnalysis()) {
				return IRAnalysisService.runDiagnostics(this.selectedAnalysis());
			}
		}

		getExecutionInfo(info) {
			if (info && info.executionInfo) {
				const { startTime, executionDuration } = info.executionInfo;
				const completedTime = startTime + (executionDuration || 0);
				return {
					...info.executionInfo,
					completedTime,
				}
			} else {
				return {};
			}
		}

		async pollForInfo({silently = false} = {}) {
			!silently && this.loadingInfo(true);
			const promises = [];

			try {
				if (this.selectedAnalysisId()) {
					const data = await IRAnalysisService.getInfo(this.selectedAnalysisId());

					for (let newInfo of data) {
						const source = this.sources().find(s => s.source.sourceId === newInfo.executionInfo.id.sourceId);
						if (source) {
							const { status: prevStatus, completedTime: prevCompletedTime } = this.getExecutionInfo(source.info());
							const executionInfo = this.getExecutionInfo(newInfo);

							if (!silently) {
								source.info(newInfo);
							}
							if (executionInfo.status === 'COMPLETE') {
								if (prevCompletedTime !== executionInfo.completedTime) {
									let resultsPromise = this.loadResultsSummary(executionInfo.id.analysisId, source, prevStatus !== 'RUNNING' && silently).then(summaryList => {
										newInfo.summaryList = summaryList;
										source.info(newInfo);
									});
									promises.push(resultsPromise);
								} else {
									newInfo.summaryList = source.info().summaryList;
									source.info(newInfo);
								}
							} else {
								source.info(newInfo);
							}
						}
					}

					const statuses = data.map(item => item.executionInfo.status)
					this.isRunning(statuses.some(status => constants.isInProgress(status)));
				}
			} catch(e) {
				this.close();
			} finally {
				this.loadingInfo(false);
			}

			await Promise.all(promises);
		}

		async loadResultsSummary(id, source, silently = true) {
			if (!authAPI.hasSourceAccess(source.source.sourceKey)) {
				return [];
			}

			!silently && this.loadingSummary.push(source.source.sourceKey);
			try {
				const sourceInfo = await IRAnalysisService.loadResultsSummary(id, source.source.sourceKey);
				return (sourceInfo && sourceInfo.summaryList) || [];
			} finally {
				this.loadingSummary.remove(source.source.sourceKey);
			}
		}

		resolveCohortId(cohortId) {
			var cohortDef = this.cohortDefs().filter(function (def) {
				return def.id === cohortId;
			})[0];
			return (cohortDef && cohortDef.name) || "Unknown Cohort";
		}

		refreshDefs() {
			cohortAPI.getCohortDefinitionList().then((list) => {
				this.cohortDefs(list);
			});
		}

		clearResults() {
			this.sources().forEach(source => source.info(null));
		}

		async loadAnalysis(version) {
			if (this.selectedAnalysis() && (this.selectedAnalysis().id() === this.selectedAnalysisId()) && !version) {
				this.startPolling();
				return;
			}

			this.loading(true);
			this.refreshDefs();
			this.clearResults();
			try {
				let analysis;
				if (version && version !== 'current') {
					const analysisVersion = await IRAnalysisService.getVersion(this.selectedAnalysisId(), version);
					analysis = analysisVersion.entityDTO;
					analysis.expression = JSON.parse(analysis.expression);
					this.previewVersion(analysisVersion.versionDTO);
				} else {
					analysis = await IRAnalysisService.getAnalysis(this.selectedAnalysisId());
					this.previewVersion(null);
				}
				this.selectedAnalysis(new IRAnalysisDefinition(analysis));
				this.dirtyFlag(new ohdsiUtil.dirtyFlag(this.selectedAnalysis()));
				this.tags(analysis.tags);
				this.versionsParams.valueHasMutated();
				this.loading(false);
				this.startPolling();
			} catch (ex) {
				alert(exceptionUtils.extractServerMessage(ex));
			} finally {
				this.loading(false);
			}
		}

		selectTab(tab) {
			commonUtils.routeTo(`${this.constants.apiPaths.analysis(this.selectedAnalysisId())}/${tab}`);
		}

		onRouterParamsChanged(params, newParams) {
			const { analysisId, activeTab, version } = Object.assign({}, params, newParams);
			if (activeTab) {
				if (Object.values(this.constants.tabs).includes(activeTab)) {
					this.activeTab(activeTab);
				}
			}
			if (analysisId) {
				this.loadAnalysis(version);
			} else if (this.selectedAnalysis() && this.selectedAnalysis().id() && !this.pollId) {
				this.startPolling();
			}
		}

		backToCurrentVersion() {
			if (this.dirtyFlag().isDirty() && !confirm(ko.i18n('common.unsavedWarning', 'Unsaved changes will be lost. Proceed?')())) {
				return;
			}
			commonUtils.routeTo(`/iranalysis/${this.selectedAnalysisId()}/version/current`);
		}

		startPolling() {
			if (!this.pollId) {
				this.pollId = JobPollService.add({
					callback: silently => this.pollForInfo({ silently }),
					interval: config.pollInterval,
					isSilentAfterFirstCall: true,
				});
			}
		}

		handleConceptSetImport(item) {
			this.criteriaContext(item);
			this.showConceptSetBrowser(true);
		}

		handleEditConceptSet(item, context) {
			if (item.conceptSetId() == null) {
				return;
			}
			this.loadConceptSet(item.conceptSetId());
		}

		loadConceptSet(conceptSetId) {
			this.conceptSetStore.current(this.selectedAnalysis().expression().ConceptSets().find(item => item.id == conceptSetId));
			this.conceptSetStore.isEditable(this.isEditable());
			commonUtils.routeTo(`/iranalysis/${this.selectedAnalysisId()}/conceptsets`);
		}

		onConceptSetSelectAction(result) {
			this.showConceptSetBrowser(false);
			if (result.action === 'add') {
				const conceptSets = this.selectedAnalysis().expression().ConceptSets;
				const newId = conceptSetUtils.newConceptSetHandler(conceptSets, this.criteriaContext());
				this.loadConceptSet(newId)
			}

			this.criteriaContext(null);
		}

		async copy() {
			this.isCopying(true);
			this.loading(true);
			const analysis = await IRAnalysisService.copyAnalysis(this.selectedAnalysisId());
			this.selectedAnalysis(new IRAnalysisDefinition(analysis));
			this.selectedAnalysisId(analysis.id);
			this.dirtyFlag(new ohdsiUtil.dirtyFlag(this.selectedAnalysis()));
			this.clearResults();
			this.versionsParams.valueHasMutated();
			this.isCopying(false);
			this.loading(false);
			commonUtils.routeTo(constants.apiPaths.analysis(analysis.id));
		}

		close() {
			this.selectedAnalysis(null);
			this.selectedAnalysisId(null);
			this.previewVersion(null);
			this.dirtyFlag(new ohdsiUtil.dirtyFlag(this.selectedAnalysis()));
			this.conceptSetStore.clear();

			this.sources().forEach(function (source) {
				source.info(null);
			});
		}

		closeAndShowList() {
			if (this.dirtyFlag().isDirty() && !confirm(ko.i18n('ir.notSavedMessage', 'Incidence Rate Analysis changes are not saved. Would you like to continue?')())) {
				return;
			}
			this.close();
			commonUtils.routeTo(constants.apiPaths.analysis());
		}

		async save() {
			if (this.previewVersion() && !confirm(ko.i18n('common.savePreviewWarning', 'Save as current version?')())) {
				return;
			}
			this.isSaving(true);
			this.loading(true);

			let irName = this.selectedAnalysis().name();
			this.selectedAnalysis().name(irName.trim());

			// Next check to see that an incidence rate with this name does not already exist
			// in the database. Also pass the id so we can make sure that the current incidence rate is excluded in this check.
			try{
				const results = await IRAnalysisService.exists(this.selectedAnalysis().name(), this.selectedAnalysisId() == undefined ? 0 : this.selectedAnalysisId());
				if (results > 0) {
					alert(ko.i18n('ir.nameConflict', 'An incidence rate with this name already exists. Please choose a different name.')());
				} else {
					const savedIR = await IRAnalysisService.saveAnalysis(this.selectedAnalysis());
					this.selectedAnalysisId(savedIR.id);
					this.selectedAnalysis(new IRAnalysisDefinition(savedIR));
					this.dirtyFlag(new ohdsiUtil.dirtyFlag(this.selectedAnalysis()));
					this.previewVersion(null);
					this.versionsParams.valueHasMutated();
					commonUtils.routeTo(constants.apiPaths.analysis(savedIR.id));
				}
			} catch (e) {
				alert(ko.i18n('ir.savingError', 'An error occurred while attempting to save an incidence rate.')());
			} finally {
				this.isSaving(false);
				this.loading(false);
			}
		}

		delete() {
			if (!confirm(ko.i18n('ir.deleteConfirmation', 'Delete incidence rate analysis? Warning: deletion can not be undone!')()))
				return;

			this.isDeleting(true);
			// reset view after save
			IRAnalysisService.deleteAnalysis(this.selectedAnalysisId()).then(() => {
				this.close();
				commonUtils.routeTo(constants.apiPaths.analysis());
			});
		}

		removeResult(analysisResult) {
			if (confirm(ko.i18nformat('ir.deleteResultConfirmation', 'Do you really want to remove result of <%=name%>?', {name:analysisResult.source.sourceName})())) {
				IRAnalysisService.deleteInfo(this.selectedAnalysisId(), analysisResult.source.sourceKey).then((response) => {
					if (response.status === 403) {
						alert(ko.i18n('ir.deleteResult403Error', 'Only Moderator role can delete generation results. Please check your role.')());
						return;
					}
					const source = this.sources().find(s => s.source.sourceId === analysisResult.source.sourceId);
					source.info(null);
				});
			}
		}

		newAnalysis() {
			this.selectedAnalysis(new IRAnalysisDefinition());
			this.dirtyFlag(new ohdsiUtil.dirtyFlag(this.selectedAnalysis()));
		};

		execute(sourceKey) {
			const sourceItem = this.sources().find(s => s.source.sourceKey === sourceKey);
			this.stoppingSources({ ...this.stoppingSources(), [sourceKey]: false });

			if (sourceItem && sourceItem.info()) {
				sourceItem.info().executionInfo.status = constants.status.PENDING;
				sourceItem.info.notifySubscribers();
			}
			else {
				// creating 'fake' temporary source info makes the UI respond to the generate action.
				const tempInfo = {
					source: sourceItem,
					executionInfo: {
						id: {sourceId: sourceItem.source.sourceId},
						status: constants.status.PENDING,
					},
					summaryList: []
				};
				sourceItem.info(tempInfo);
			}
			this.sources.notifySubscribers();
			this.isRunning(true);
			IRAnalysisService.execute(this.selectedAnalysisId(), sourceItem.source.sourceKey)
				.then(({data}) => {
					jobDetailsService.createJob(data);
				});
		}

		cancelExecution(sourceKey) {
			const sourceItem = this.sources().find(s => s.source.sourceKey === sourceKey);
			this.stoppingSources({ ...this.stoppingSources(), [sourceKey]: true });

			IRAnalysisService
				.cancelExecution(this.selectedAnalysisId(), sourceItem.source.sourceKey);
		}

		async afterImportSuccess(res) {
			this.isSaving(true);
			this.loading(true);
			try {
				this.refreshDefs();
				this.activeTab(this.tabs.DEFINITION);
				this.close();
				commonUtils.routeTo(constants.apiPaths.analysis(res.id));
			} catch (e) {
				alert('An error occurred while attempting to import an incidence rate.');
			} finally {
				this.isSaving(false);
				this.loading(false);
			}
		};

		async exportAnalysisCSV() {
			this.exporting(true);
			try {
				await FileService.loadZip(`${config.api.url}ir/${this.selectedAnalysisId()}/export`,
					`incidence-rate-${this.selectedAnalysisId()}.zip`);
			}catch (e) {
				alert(exceptionUtils.translateException(e));
			}finally {
				this.exporting(false);
			}
		}

		init() {
			this.refreshDefs();
			const sources = sharedState.sources();
			const sourceList = [];
			sources.forEach(source => {
				if (source.daimons.filter(function (daimon) {
						return daimon.daimonType === "CDM";
					}).length > 0
					&& source.daimons.filter(function (daimon) {
						return daimon.daimonType === "Results";
					}).length > 0) {
					sourceList.push({
						source: source,
						info: ko.observable()
					});
				}
			});
			this.sources(sourceList);
			!this.selectedAnalysis() && this.newAnalysis();
		}

		async exportSql({ analysisId = 0, expression = {} } = {}) {
			const sql = await IRAnalysisService.exportSql({
				analysisId,
				expression,
			});
			return sql;
		}

		getAuthorship() {
			const analysis = this.selectedAnalysis();

			let createdText, createdBy, createdDate, modifiedBy, modifiedDate;

			if (this.previewVersion()) {
				createdText = ko.i18n('components.authorship.versionCreated', 'version created');
				createdBy = this.previewVersion().createdBy ? this.previewVersion().createdBy.name : ko.i18n('common.anonymous', 'anonymous');
				createdDate = commonUtils.formatDateForAuthorship(this.previewVersion().createdDate);
				modifiedBy = null;
				modifiedDate = null;
			} else {
				createdText = ko.i18n('components.authorship.created', 'created');
				createdBy = analysis.createdBy() ? analysis.createdBy().name : ko.i18n('common.anonymous', 'anonymous');
				createdDate = commonUtils.formatDateForAuthorship(analysis.createdDate);
				modifiedBy = analysis.modifiedBy() ? analysis.modifiedBy().name : ko.i18n('common.anonymous', 'anonymous');
				modifiedDate = commonUtils.formatDateForAuthorship(analysis.modifiedDate);
			}

			return {
				createdText: createdText,
				createdBy: createdBy,
				createdDate: createdDate,
				modifiedBy: modifiedBy,
				modifiedDate: modifiedDate,
			}
		}

		// cleanup
		dispose() {
			super.dispose();
			this.incidenceRateCaption && this.incidenceRateCaption.dispose();
			JobPollService.stop(this.pollId);
		}
	}

	return commonUtils.build('ir-manager', IRAnalysisManager, view);
});