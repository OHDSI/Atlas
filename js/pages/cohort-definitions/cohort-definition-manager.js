define(['jquery', 'knockout', 'text!./cohort-definition-manager.html',
	'appConfig',
	'components/cohortbuilder/CohortDefinition',
	'services/CohortDefinition',
	'services/MomentAPI',
	'services/ConceptSet',
	'components/conceptset/utils',
	'utils/DatatableUtils',
	'components/cohortbuilder/CohortExpression',
	'conceptsetbuilder/InputTypes/ConceptSet',
	'services/CohortReporting',
	'services/VocabularyProvider',
	'utils/ExceptionUtils',
	'atlas-state',
	'clipboard',
	'd3',
	'services/Jobs',
	'services/job/jobDetail',
	'services/JobDetailsService',
	'pages/cohort-definitions/const',
	'pages/Page',
	'utils/AutoBind',
	'utils/Clipboard',
	'utils/CommonUtils',
	'pages/cohort-definitions/const',
	'services/AuthAPI',
	'services/Poll',
	'services/file',
	'const',
	'./const',
	'components/cohortbuilder/components/FeasibilityReportViewer',
	'databindings',
	'faceted-datatable',
	'databindings/expressionCartoonBinding',
	'./components/cohortfeatures/main',
	'./components/checks/conceptset-warnings',
	'conceptset-modal',
	'css!./cohort-definition-manager.css',
	'assets/ohdsi.util',
	'components/cohortbuilder/InclusionRule',
	'components/modal-pick-options',
	'components/heading',
	'components/conceptsetInclusionCount/conceptsetInclusionCount',
	'components/modal',
	'components/modal-exit-message',
], function (
	$,
	ko,
	view,
	config,
	CohortDefinition,
	cohortDefinitionService,
	momentApi,
	conceptSetService,
	conceptSetUitls,
	datatableUtils,
	CohortExpression,
	ConceptSet,
	cohortReportingService,
	vocabularyApi,
	exceptionUtils,
	sharedState,
	clipboard,
	d3,
	jobService,
	jobDetail,
	jobDetailsService,
	cohortConst,
	Page,
	AutoBind,
	Clipboard,
	commonUtils,
	costUtilConst,
	authApi,
	PollService,
	FileService,
	globalConstants,
	constants,
) {
	const includeKeys = ["UseEventEnd"];
	function pruneJSON(key, value) {
		if (value === 0 || value || includeKeys.includes(key) ) {
			return value;
		} else {
			return
		}
	}

	function conceptSetSorter(a, b) {
		var textA = a.name().toUpperCase();
		var textB = b.name().toUpperCase();
		return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
	}

	class CohortDefinitionManager extends AutoBind(Clipboard(Page)) {
		constructor(params) {
			super(params);
			this.pollTimeout = null;
			this.authApi = authApi;
			this.config = config;
			this.selectedConcepts = sharedState.selectedConcepts;
			this.model = params.model;
			this.warningsTotals = ko.observable(0);
			this.warningCount = ko.observable(0);
			this.infoCount = ko.observable(0);
			this.criticalCount = ko.observable(0);
			this.isExitMessageShown = ko.observable();
			this.exitMessage = ko.observable();
			this.exporting = ko.observable();
			this.service = cohortDefinitionService;
			this.defaultName = globalConstants.newEntityNames.cohortDefinition;
			this.isReportGenerating = ko.observable(false);
			this.cdmSources = ko.computed(() => {
				return sharedState.sources().filter((source) => commonUtils.hasCDM(source) && authApi.hasSourceAccess(source.sourceKey));
			});
			this.warningClass = ko.computed(() => {
				if (this.warningsTotals() > 0){
					if (this.criticalCount() > 0) {
						return 'warning-alarm';
					} else if (this.warningCount() > 0) {
						return 'warning-warn';
					} else {
						return 'warning-info';
					}
				}
				return '';
			});

			this.cohortDefinitionCaption = ko.computed(() => {
				if (this.model.currentCohortDefinition()) {
					if (this.model.currentCohortDefinition().id() == 0) {
					return this.defaultName;
				} else {
						return 'Cohort #' + this.model.currentCohortDefinition().id();
				}
			}
			});
			this.isNameFilled = ko.computed(() => {
				return this.model.currentCohortDefinition() && this.model.currentCohortDefinition().name();
			});

			this.isNameCorrect = ko.computed(() => {
				return this.isNameFilled() && this.model.currentCohortDefinition().name() !== this.defaultName;
			});
			this.isAuthenticated = ko.pureComputed(() => {
				return this.authApi.isAuthenticated();
			});
			this.isNew = ko.pureComputed(() => {
				return !this.model.currentCohortDefinition() || (this.model.currentCohortDefinition().id() == 0);
			});
			this.canEdit = this.model.canEditCurrentCohortDefinition;
			this.isSaving = ko.observable(false);
			this.isCopying = ko.observable(false);
			this.isDeleting = ko.observable(false);
			this.isProcessing = ko.computed(() => {
			    return this.isSaving() || this.isCopying() || this.isDeleting();
			});
			this.canCopy = ko.pureComputed(() => {
				return !this.dirtyFlag().isDirty() && !this.isNew() &&
					(this.isAuthenticated() && this.authApi.isPermittedCopyCohort(this.model.currentCohortDefinition().id()) || !config.userAuthenticationEnabled);
			});
			this.canDelete = ko.pureComputed(() => {
				if (this.isNew()) {
					return false;
				}
				return ((this.isAuthenticated() && this.authApi.isPermittedDeleteCohort(this.model.currentCohortDefinition().id()) || !config.userAuthenticationEnabled));
			});
			this.hasAccess = ko.pureComputed(() => {
				if (!config.userAuthenticationEnabled) {
					return true;
				}
				if (!this.isAuthenticated()) {
					return false;
				}
				if (this.isNew()) {
					return this.authApi.isPermittedCreateCohort();
				}

				return this.authApi.isPermittedReadCohort(this.model.currentCohortDefinition().id());
			});

			this.hasAccessToGenerate = (sourceKey) => {
				if (this.isNew()) {
					return false;
				}

				return this.authApi.isPermittedGenerateCohort(this.model.currentCohortDefinition().id(), sourceKey);
			}
			this.hasAccessToReadCohortReport = (sourceKey) => {
				return this.isAuthenticated() && this.authApi.isPermittedReadCohortReport(this.model.currentCohortDefinition().id(), sourceKey);
			}
			if (!this.hasAccess()) return;

			this.renderCountColumn = datatableUtils.renderCountColumn;

			this.generatedSql = {};
			this.generatedSql.mssql = ko.observable('');
			this.generatedSql.oracle = ko.observable('');
			this.generatedSql.postgresql = ko.observable('');
			this.generatedSql.redshift = ko.observable('');
			this.generatedSql.msaps = ko.observable('');
			this.generatedSql.impala = ko.observable('');
			this.generatedSql.netezza = ko.observable('');
			this.generatedSql.bigquery = ko.observable('');
			this.templateSql = ko.observable('');
			this.tabMode = this.model.currentCohortDefinitionMode;
			this.cohortConst = cohortConst;
			this.generationTabMode = ko.observable("inclusion");
			this.inclusionTabMode = ko.observable("person");
			this.exportTabMode = ko.observable('printfriendly');
			this.importTabMode = ko.observable(cohortConst.importTabModes.identifiers);
			this.exportSqlMode = ko.observable('ohdsisql');
			this.importConceptSetJson = ko.observable();
			this.conceptSetTabMode = this.model.currentConceptSetMode;
			this.showImportConceptSetModal = ko.observable(false);
			this.dirtyFlag = this.model.currentCohortDefinitionDirtyFlag;
			this.isLoadingSql = ko.observable(false);
			this.sharedState = sharedState;
			this.identifiers = ko.observable();
			this.sourcecodes = ko.observable();
			this.conceptLoading = ko.observable(false);
			this.conceptSetName = ko.observable();
			this.tabPath = ko.computed(() => {
				var path = this.tabMode();
				if (path === 'export') {
						path += '/' + this.exportTabMode();
				}
				if (this.exportTabMode() === 'cartoon') {
					setTimeout(() => {
						this.delayedCartoonUpdate('ready');
					}, 10);
				}
				return path;
			});
			this.canSave = ko.pureComputed(()=> {
				return this.dirtyFlag().isDirty() && !this.isRunning() && this.canEdit() && this.isNameCorrect();
			});

			this.disableConceptSetExport = ko.pureComputed(() => {
				return this.dirtyFlag().isDirty() || this.model.currentCohortDefinition().expression().ConceptSets().length === 0;
			});

			this.disableConceptSetExportMessage = ko.pureComputed(() => {
				if (this.model.currentCohortDefinition().expression().ConceptSets().length === 0) {
					return "No concept sets to export.";
				}
				if (this.dirtyFlag().isDirty()) {
					return "You must save the definition before you can export.";
				}
			})

			this.delayedCartoonUpdate = ko.observable(null);

			this.saveConceptSetShow = ko.observable(false);
			this.newConceptSetName = ko.observable();

			this.canGenerate = ko.pureComputed(() => {
				var isDirty = this.dirtyFlag() && this.dirtyFlag().isDirty();
				var isNew = this.model.currentCohortDefinition() && (this.model.currentCohortDefinition().id() == 0);
				const hasInitialEvent = this.model.currentCohortDefinition().expression().PrimaryCriteria().CriteriaList().length > 0;
				var canGenerate = !(isDirty || isNew) && hasInitialEvent;
				return (canGenerate);
			});

			this.modifiedJSON = "";
			Object.defineProperty(this, 'expressionJSON', {
				get: () => this.getExpressionJson(),
				set: (val) => this.setExpressionJson(val),
			});

			this.selectedSource = ko.observable();
			this.selectedReport = ko.observable();
			this.selectedReportCaption = ko.observable();
			this.selectedSourceKey = ko.pureComputed(() => this.selectedSource().sourceKey);
			this.loadingReport = ko.observable(false);
			this.sortedConceptSets = ko.computed((d) => {
				if (this.model.currentCohortDefinition() != null) {
					var clone = this.model.currentCohortDefinition().expression().ConceptSets().slice(0);
					return clone.sort(conceptSetSorter);
				}
			});

		// model behaviors
			this.onConceptSetTabRespositoryConceptSetSelected = (conceptSet) => {
				this.showImportConceptSetModal(false);
				this.model.loadConceptSet(conceptSet.id, 'cohort-definition-manager', 'cohort', 'details');
			}

			this.includedConceptsColumns = [
				{
				title: '<i class="fa fa-shopping-cart"></i>',
					render: (s, p, d) => {
						var css = '';
						var icon = 'fa-shopping-cart';
						if (sharedState.selectedConceptsIndex[d.CONCEPT_ID] == 1) {
							css = ' selected';
						}
						return '<i class="fa ' + icon + ' ' + css + '"></i>';
					},
				orderable: false,
				searchable: false
			},
			{
				title: 'Id',
				data: 'CONCEPT_ID'
			},
			{
				title: 'Code',
				data: 'CONCEPT_CODE'
			},
			{
				title: 'Name',
				data: 'CONCEPT_NAME',
				render: commonUtils.renderLink,
			},
			{
				title: 'Class',
				data: 'CONCEPT_CLASS_ID'
			},
			{
				title: 'Standard Concept Caption',
				data: 'STANDARD_CONCEPT_CAPTION',
				visible: false
			},
			{
				title: 'RC',
				data: 'RECORD_COUNT',
				className: 'numeric'
			},
			{
				title: 'DRC',
				data: 'DESCENDANT_RECORD_COUNT',
				className: 'numeric'
			},
			{
				title: 'Domain',
				data: 'DOMAIN_ID'
			},
			{
				title: 'Vocabulary',
				data: 'VOCABULARY_ID'
			},
			{
				title: 'Ancestors',
				data: 'ANCESTORS',
				render: conceptSetService.getAncestorsRenderFunction()
			}
		];

			this.ancestors = ko.observableArray();
			this.ancestorsModalIsShown = ko.observable(false);
			this.showAncestorsModal = conceptSetService.getAncestorsModalHandler(this);
			this.includedDrawCallback = conceptSetService.getIncludedConceptSetDrawCallback({ ...this, searchConceptsColumns: this.includedConceptsColumns });

			this.includedConceptsOptions = {
				Facets: [
					{
					'caption': 'Vocabulary',
						'binding': (o) => {
							return o.VOCABULARY_ID;
						}
					},
					{
						'caption': 'Class',
							'binding': (o) => {
							return o.CONCEPT_CLASS_ID;
						}
					},
					{
						'caption': 'Domain',
							'binding': (o) => {
								return o.DOMAIN_ID;
							}
					},
					{
						'caption': 'Standard Concept',
							'binding': (o) => {
								return o.STANDARD_CONCEPT_CAPTION;
							}
					},
					{
						'caption': 'Invalid Reason',
							'binding': (o) => {
								return o.INVALID_REASON_CAPTION;
							}
					},
					{
						'caption': 'Has Records',
							'binding': (o) => {
								return parseInt(o.RECORD_COUNT) > 0;
							}
					},
					{
						'caption': 'Has Descendant Records',
							'binding': (o) => {
								return parseInt(o.DESCENDANT_RECORD_COUNT) > 0;
							}
					},
				]
		};

			this.stopping = this.model.cohortDefinitionSourceInfo().reduce((acc, target) => ({...acc, [target.sourceKey]: ko.observable(false)}), {});
			this.isSourceStopping = (source) => this.stopping[source.sourceKey];

			this.pollForInfo = () => {
				if (this.pollTimeout) {
					clearTimeout(this.pollTimeout);
					this.pollTimeout = null;
				}

				if (this.model.currentCohortDefinition()) {
					var id = this.model.currentCohortDefinition().id();
					cohortDefinitionService.getInfo(id).then((infoList) => {
						var hasPending = false;

							infoList.forEach((info) => {
							// obtain source reference
								var source = this.model.cohortDefinitionSourceInfo().filter((cdsi) => {
								var sourceId = sharedState.sources().find(source => source.sourceKey == cdsi.sourceKey).sourceId;
								return sourceId === info.id.sourceId;
							})[0];

							if (source) {
								// only bother updating those sources that we know are running
									if (this.isSourceRunning(source)) {
									source.status(info.status);
									source.includeFeatures(info.includeFeatures);
									source.isValid(info.isValid);
									source.startTime(momentApi.formatDateTime(new Date(info.startTime)));
									source.executionDuration('...');
									source.personCount('...');
									source.recordCount('...');

									if (info.status != "COMPLETE" && info.status != "FAILED") {
										hasPending = true;
											if (this.selectedSource() && source.sourceId === this.selectedSource().sourceId) {
												this.loadingReport(true);
										}
									} else {
											if (this.selectedSource() && source.sourceId === this.selectedSource().sourceId) {
												this.loadingReport(false);
												this.selectViewReport(source);
										}
										var commaFormatted = d3.format(",");
										source.executionDuration(momentApi.formatDuration(info.executionDuration));
										source.personCount(commaFormatted(info.personCount));
										source.recordCount(commaFormatted(info.recordCount));
										source.failMessage(info.failMessage);
									}
								}
							}
						});

						if (hasPending) {
								this.pollTimeout = setTimeout(() => {
									this.pollForInfo();
							}, 10000);
						}
					});
				}
			}

			this.isRunning = ko.pureComputed(() => {
				return this.model.cohortDefinitionSourceInfo().filter( (info) => {
					return !(info.status() == "COMPLETE" || info.status() == "n/a");
				}).length > 0;
			});

			this.canCreateConceptSet = ko.computed( () => {
				return ((this.authApi.isAuthenticated() && this.authApi.isPermittedCreateConceptset()) || !config.userAuthenticationEnabled);
			});

			this.cohortDefinitionLink = ko.computed(() => {
				if (this.model.currentCohortDefinition()) {
					return commonUtils.normalizeUrl(this.config.api.url, "cohortdefinition", this.model.currentCohortDefinition().id());
				}
			});

			// reporting sub-system
			this.generateButtonCaption = ko.observable('Generate Reports');
			this.generateReportsEnabled = ko.observable(false);
			this.createReportJobFailed = ko.observable(false);
			this.createReportJobError = ko.observable();
			this.reportingError = ko.observable();
			this.currentJob = ko.observable();
			this.reportingSourceStatusAvailable = ko.observable(false);
			this.reportingSourceStatusLoading = ko.observable(false);
			this.reportOptionCaption = ko.pureComputed(() => {
				return this.reportingSourceStatusLoading() ? "Loading Reports..." : "Select a Report";
			});
			this.reportingSourceStatus = ko.observable();
			this.reportingAvailableReports = ko.observableArray();

			this.pollId = null;
			this.reportSourceKeySub = this.model.reportSourceKey.subscribe(source => {
				PollService.stop(this.pollId);
				this.model.reportReportName(null);
				this.reportingSourceStatusAvailable(false);
				this.reportingAvailableReports.removeAll();
				const cd = this.model.currentCohortDefinition();
				source && this.startPolling(cd, source);
			});

			this.reportingState = ko.computed(() => {
				// require a data source selection
					if (this.model.reportSourceKey() == undefined) {
						this.generateReportsEnabled(false);
					return "awaiting_selection";
				}

				// check if the cohort has been generated
					var sourceInfo = this.model.cohortDefinitionSourceInfo().find(d => d.sourceKey == this.model.reportSourceKey());
					if (this.getStatusMessage(sourceInfo) != 'COMPLETE') {
						this.generateReportsEnabled(false);
					return "cohort_not_generated";
				}

				// check which reports have required data
					if (!this.reportingSourceStatusAvailable() && !this.reportingSourceStatusLoading()) {
						this.reportingSourceStatusLoading(true);
						cohortReportingService.getCompletedAnalyses(sourceInfo, this.model.currentCohortDefinition().id()).done(results => {
						var reports = cohortReportingService.getAvailableReports(results);
						if (reports.length == 0) {
								this.reportingAvailableReports(reports);
								this.generateReportsEnabled(false);
								this.reportingSourceStatusAvailable(true);
								this.reportingSourceStatusLoading(false);
							return "checking_status";
						}
							cohortReportingService.getCompletedHeraclesHeelAnalyses(sourceInfo, this.model.currentCohortDefinition().id()).done(heelResults => {
							if (heelResults.length > 0) {
								reports.push({name: "Heracles Heel", reportKey: "Heracles Heel", analyses: []});
							}
								this.reportingAvailableReports(reports);
								this.generateReportsEnabled(false);
								this.reportingSourceStatusAvailable(true);
								this.reportingSourceStatusLoading(false);
							return "checking_status";
						});
					});
				}

				// check if we can tell if the job to generate the reports is already running
				if (this.model.currentCohortDefinition() && this.currentJob()) {
					if (this.currentJob().status && (this.currentJob().status == 'STARTED' || this.currentJob().status == 'STARTING' || this.currentJob().status == 'RUNNING')) {
						this.generateReportsEnabled(false);
						return "generating_reports";
					}
				}

					if (this.reportingAvailableReports().length == 0) {
					// reset button to allow generation
						this.generateReportsEnabled(true);
					return "report_unavailable";
				}

					if (this.model.reportReportName() == undefined) {
					// reset button to allow regeneration
						this.generateReportsEnabled(true);
					return "awaiting_selection";
				}

					if (this.model.currentCohortDefinition()) {
						this.generateReportsEnabled(true);
						this.model.reportCohortDefinitionId(this.model.currentCohortDefinition().id());
						this.model.reportTriggerRun(true);
					return "report_active";
				}

				var errorPackage = {};
					errorPackage.sourceAnalysesStatus = this.model.sourceAnalysesStatus[this.model.reportSourceKey()]();
					errorPackage.report = this.model.reportReportName();
					this.reportingError(JSON.stringify(errorPackage));
				// reset button to allow regeneration
					this.generateReportsEnabled(false);
				return "unknown_cohort_report_state";
			});

			this.showReportNameDropdown = ko.computed(() => {
				return this.model.reportSourceKey() != undefined &&
					this.reportingState() != 'checking_status' &&
					this.reportingState() != 'cohort_not_generated' &&
					this.reportingState() != 'reports_not_generated' &&
					this.reportingState() != 'generating_reports';
			});

			this.showUtilizationToRunModal = ko.observable(false);
			this.checkedUtilReports = ko.observableArray([]);

			const reportPacks = cohortReportingService.visualizationPacks;
			const reports = [
				reportPacks.healthcareUtilPersonAndExposureBaseline,
				reportPacks.healthcareUtilPersonAndExposureCohort,
				reportPacks.healthcareUtilVisitRecordsBaseline,
				reportPacks.healthcareUtilVisitDatesBaseline,
				reportPacks.healthcareUtilCareSiteDatesBaseline,
				reportPacks.healthcareUtilVisitRecordsCohort,
				reportPacks.healthcareUtilVisitDatesCohort,
				reportPacks.healthcareUtilCareSiteDatesCohort,
				reportPacks.healthcareUtilDrugBaseline,
				reportPacks.healthcareUtilDrugCohort,
			].map(item => ({
				label: item.name,
				value: item.analyses,
			}));

			this.utilReportOptions = {
				reports : {
					title: 'Reports',
					options: reports,
                    selectedOptions: ko.observableArray([
                        reportPacks.healthcareUtilPersonAndExposureCohort.analyses,
                        reportPacks.healthcareUtilVisitRecordsCohort.analyses,
                    ]),
				},
				periods: {
					title: 'Periods',
					options: costUtilConst.periods,
					selectedOptions: ko.observableArray([]),
				},
				rollups: {
					title: 'Rollups',
                    options: costUtilConst.rollups,
                    selectedOptions: ko.observableArray([]),
				}
			};

			this.selectedCriteria = ko.observable();
			this.cohortLinkModalOpened = ko.observable(false);
			this.cohortDefinitionOpened = ko.observable(false);
			this.analysisTypesOpened = ko.observable(false);
		}

			// METHODS

		startPolling(cd, source) {
			this.pollId = PollService.add({
				callback: () => this.queryHeraclesJob(cd, source),
				interval: 10000,
			});
		}

		async queryHeraclesJob(cd, source) {
			const testName = "HERACLES_COHORT_" + cd.id() + "_" + source;
			try {
				const { data } = await jobService.getByName(testName, "cohortAnalysisJob");
				data.jobParameters ? this.currentJob({ ...data, name: data.jobParameters.jobName }) : this.currentJob(null)
			} catch (e) {
				console.error(e)
			}
		}

			delete () {
				if (!confirm("Delete cohort definition? Warning: deletion can not be undone!"))
					return;

				this.isDeleting(true);
				clearTimeout(this.pollTimeout);

				// reset view after save
					cohortDefinitionService.deleteCohortDefinition(this.model.currentCohortDefinition().id()).
                    then( (result) => {
						this.model.currentCohortDefinition(null);
						document.location = "#/cohortdefinitions"
					}, (error) => {
						console.log("Error: " + error);
						if(error.status == 409) {
						    alert("Cohort definition cannot be deleted because it is referenced in some analysis");
                            this.isDeleting(false);
						} else {
						    authApi.handleAccessDenied(error);
						}
					});
			}

			async save () {
				this.isSaving(true);
				clearTimeout(this.pollTimeout);

				// Next check to see that a cohort definition with this name does not already exist
				// in the database. Also pass the id so we can make sure that the
				// current Cohort Definition is excluded in this check.

				try {
					const results = await cohortDefinitionService.exists(this.model.currentCohortDefinition().name(), this.model.currentCohortDefinition().id());
					if (results > 0) {
						alert('A cohort definition with this name already exists. Please choose a different name.');
					} else {
						this.model.clearConceptSet();

						// If we are saving a new cohort definition (id === 0) then clear
						// the id field before saving
						if (this.model.currentCohortDefinition().id() === "0") {
							this.model.currentCohortDefinition().id(undefined);
						}
						var definition = ko.toJS(this.model.currentCohortDefinition());

						// reset view after save
						const savedDefinition = await cohortDefinitionService.saveCohortDefinition(definition);
						definition = new CohortDefinition(savedDefinition);
						const redirectWhenComplete = definition.id() != this.model.currentCohortDefinition().id();
						this.model.currentCohortDefinition(definition);
						if (redirectWhenComplete) {
							commonUtils.routeTo(constants.paths.details(definition.id()));
						}
					}
				} catch (e) {
					alert('An error occurred while attempting to save a cohort definition.');
				} finally {
					this.isSaving(false);
				}
			}

			close () {
				if (this.model.currentCohortDefinitionDirtyFlag().isDirty() && !confirm("Your cohort changes are not saved. Would you like to continue?")) {
					return;
				} else {
					document.location = "#/cohortdefinitions"
						this.model.currentConceptSet(null);
						this.model.currentConceptSetDirtyFlag().reset();
						this.model.currentCohortDefinition(null);
						this.model.currentCohortDefinitionDirtyFlag().reset();
						this.model.reportCohortDefinitionId(null);
						this.model.reportReportName(null);
						this.model.reportSourceKey(null);
				}
			}
			copy () {
				this.isCopying(true);
				clearTimeout(this.pollTimeout);
				// reset view after save
				cohortDefinitionService.copyCohortDefinition(this.model.currentCohortDefinition().id()).then((result) => {
					document.location = "#/cohortdefinition/" + result.id;
				});
			}

			isSourceRunning(source) {
				if (source) {
					switch (source.status()) {
						case 'COMPLETE':
							return false;
							break;
						case 'n/a':
							return false;
							break;
						default:
							return true;
					}
				} else {
					return false;
				}
			}

			showSql () {
				this.isLoadingSql(true);

				this.templateSql('');
				this.generatedSql.mssql('');
				this.generatedSql.oracle('');
				this.generatedSql.postgresql('');
				this.generatedSql.redshift('');
				this.generatedSql.msaps('');
				this.generatedSql.impala('');
				this.generatedSql.netezza('');
				this.generatedSql.bigquery('');

				var templateSqlPromise = this.service.getSql(ko.toJS(this.model.currentCohortDefinition().expression, pruneJSON));

				templateSqlPromise.then((result) => {
					this.templateSql(result.templateSql);
					var mssqlTranslatePromise = this.service.translateSql(result.templateSql, 'sql server');
						mssqlTranslatePromise.then(({data}) => {
							this.generatedSql.mssql(data.targetSQL);
					});

					var msapsTranslatePromise = this.service.translateSql(result.templateSql, 'pdw');
						msapsTranslatePromise.then(({data}) => {
							this.generatedSql.msaps(data.targetSQL);
					});

					var oracleTranslatePromise = this.service.translateSql(result.templateSql, 'oracle');
						oracleTranslatePromise.then(({data}) => {
							this.generatedSql.oracle(data.targetSQL);
					});

					var postgresTranslatePromise = this.service.translateSql(result.templateSql, 'postgresql');
						postgresTranslatePromise.then(({data}) => {
							this.generatedSql.postgresql(data.targetSQL);
					});

					var redshiftTranslatePromise = this.service.translateSql(result.templateSql, 'redshift');
						redshiftTranslatePromise.then(({data}) => {
							this.generatedSql.redshift(data.targetSQL);
					});

					var impalaTranslatePromise = this.service.translateSql(result.templateSql, 'impala');
						impalaTranslatePromise.then(({data}) => {
							this.generatedSql.impala(data.targetSQL);
					});

					var netezzaTranslatePromise = this.service.translateSql(result.templateSql, 'netezza');
					netezzaTranslatePromise.then(({data})=> {
							this.generatedSql.netezza(data.targetSQL);
					});

					const bigqueryTranslatePromise = this.service.translateSql(result.templateSql, 'bigquery');
					bigqueryTranslatePromise.then(({data}) => this.generatedSql.bigquery(data.targetSQL));

					$.when(mssqlTranslatePromise, msapsTranslatePromise, oracleTranslatePromise, postgresTranslatePromise, redshiftTranslatePromise, impalaTranslatePromise, netezzaTranslatePromise).then(() => {
							this.isLoadingSql(false);
					});
				});
			}

			getSourceInfo (sourceKey) {
				return this.model.cohortDefinitionSourceInfo().filter((d) => {
					return d.sourceKey == sourceKey
				})[0];
			}

			getSourceId (sourceKey) {
				return sharedState.sources().find(source => source.sourceKey === sourceKey).sourceId;
			}

			generateCohort (source, includeFeatures) {
				this.stopping[source.sourceKey](false);
				this.getSourceInfo(source.sourceKey).status('PENDING');
				if (this.selectedSource() && this.selectedSource().sourceId === source.sourceId) {
					this.loadingReport(true);
				}
				cohortDefinitionService.generate(this.model.currentCohortDefinition().id(), source.sourceKey, includeFeatures)
					.catch(this.authApi.handleAccessDenied)
					.then(({data}) => {
						jobDetailsService.createJob(data);
						setTimeout( () => {
							if (!this.pollTimeout) {
								this.pollForInfo();
							}
						}, 3000);
					});
			}

			cancelGenerate (source) {
				this.stopping[source.sourceKey](true);
				cohortDefinitionService.cancelGenerate(this.model.currentCohortDefinition().id(), source.sourceKey);
			};

			hasCDM (source) {
				for (var d = 0; d < source.daimons.length; d++) {
					if (source.daimons[d].daimonType == 'CDM') {
						return true;
					}
				}
				return false;
			}

			hasResults (source) {
				for (var d = 0; d < source.daimons.length; d++) {
					if (source.daimons[d].daimonType == 'Results') {
						return true;
					}
				}
				return false;
			}

			closeConceptSet () {
				this.model.clearConceptSet();
			}

			deleteConceptSet () {
				this.model.currentCohortDefinition().expression().ConceptSets.remove((item) => {
					return item.id == this.model.currentConceptSet().id;
				});
				this.closeConceptSet();
			}

			removeConceptSet(id) {
				this.model.currentCohortDefinition().expression().ConceptSets.remove(
					function (item) {
						return item.id === id;
					}
				);
			}

			removeInclusionRule(name) {
				this.model.currentCohortDefinition().expression().InclusionRules.remove(
					(item) => item.name() === name
				);
			}

			fixConceptSet(warning) {
				if (warning.type === 'ConceptSetWarning' && warning.conceptSetId) {
					this.removeConceptSet(warning.conceptSetId);
				} else if (warning.type === 'IncompleteRuleWarning' && warning.ruleName) {
					this.removeInclusionRule(warning.ruleName);
				}
			}

			showSaveConceptSet () {
				this.newConceptSetName(this.model.currentConceptSet().name());
				this.saveConceptSetShow(true);
			};

			saveConceptSet () {
				this.saveConceptSetShow(false);
				var conceptSet = {
					id: 0,
					name: this.newConceptSetName()
				};
				var conceptSetItems = conceptSetUitls.toConceptSetItems(this.selectedConcepts());
				var conceptSetId;
				var itemsPromise = (data) => {
					conceptSetId = data.data.id;
					return conceptSetService.saveConceptSetItems(conceptSetId, conceptSetItems);
				};
				conceptSetService.saveConceptSet(conceptSet)
					.then(itemsPromise);
			};

			createConceptSet() {
				var newConceptSet = new ConceptSet();
				var cohortConceptSets = this.model.currentCohortDefinition().expression().ConceptSets;
				newConceptSet.id = cohortConceptSets().length > 0 ? Math.max(...cohortConceptSets().map(c => c.id)) + 1 : 0;
				return newConceptSet;
			}

			loadConceptSet(conceptSet, view) {
				var cohortConceptSets = this.model.currentCohortDefinition().expression().ConceptSets;
				cohortConceptSets.push(conceptSet);
				this.model.loadConceptSet(conceptSet.id, 'cohort-definition-manager', 'cohort', view || 'details');
				this.model.currentCohortDefinitionMode("conceptsets");
			}

			newConceptSet () {
				this.loadConceptSet(this.createConceptSet());
			};

			importConceptSet () {
		  	this.loadConceptSet(this.createConceptSet(), 'import');
				this.conceptSetTabMode(this.cohortConst.conceptSetTabModes.import);
    	};

			importFromRepository () {
				this.showImportConceptSetModal(true);
			};

			onConceptSetRepositoryImport (newConceptSet) {
				this.showImportConceptSetModal(false);
				vocabularyApi.getConceptSetExpression(newConceptSet.id)
					.done((result)=> {
						var conceptSet = this.findConceptSet();
						conceptSet.name(newConceptSet.name);
						conceptSet.expression.items().forEach((item)=> {
							sharedState.selectedConceptsIndex[item.concept.CONCEPT_ID] = 0;
							sharedState.selectedConcepts.remove((v)=> {
								return v.concept.CONCEPT_ID === item.concept.CONCEPT_ID;
							});
						});
						conceptSet.expression.items().length = 0;
						this.importConceptSetExpressionItems(result.items);
					});
			};

			clearImportConceptSetJson () {
				this.importConceptSetJson('');
			};

			findConceptSet () {
				return this.model.currentCohortDefinition()
					.expression()
					.ConceptSets()
						.find((item) => {
							return item.id === this.model.currentConceptSet().id;
					});
			};

			importConceptSetExpression () {
				var items = JSON.parse(this.importConceptSetJson()).items;
				this.importConceptSetExpressionItems(items);
    	};

			importConceptSetExpressionItems (items) {
				var conceptSet = this.findConceptSet();
				if (!conceptSet) {
					return;
				}

				var conceptSetItemsToAdd = sharedState.selectedConcepts();
				items.forEach((item)=> {
					var conceptSetItem = {};
					conceptSetItem.concept = item.concept;
					conceptSetItem.isExcluded = ko.observable(item.isExcluded);
					conceptSetItem.includeDescendants = ko.observable(item.includeDescendants);
					conceptSetItem.includeMapped = ko.observable(item.includeMapped);

					sharedState.selectedConceptsIndex[item.concept.CONCEPT_ID] = 1;
					conceptSetItemsToAdd.push(conceptSetItem);
				});
				sharedState.selectedConcepts(conceptSetItemsToAdd);
				this.model.loadCohortConceptSet(conceptSet.id, 'cohort-definition-manager', 'details');
				this.clearImportConceptSetJson();
			};

			appendConcepts(response) {
				var conceptSetItemsToAdd = sharedState.selectedConcepts();
				response.data.forEach((item) => {
					if (sharedState.selectedConceptsIndex[item.CONCEPT_ID] != 1) {
						sharedState.selectedConceptsIndex[item.CONCEPT_ID] = 1;
						conceptSetItemsToAdd.push(commonUtils.createConceptSetItem(item));
					}
				});
				sharedState.selectedConcepts(conceptSetItemsToAdd);
				if (this.model.currentCohortDefinition() && this.model.currentConceptSetSource() === "cohort") {
					var conceptSet = this.model.currentCohortDefinition()
						.expression()
						.ConceptSets()
							.find( (item) => {
								return item.id === this.model.currentConceptSet().id;
						});
					if (conceptSet) {
						conceptSet.expression.items.valueHasMutated();
					}
				}
				this.conceptSetTabMode('details');
			}

			importConceptIdentifiers () {
				this.conceptLoading(true);
				vocabularyApi
					.getConceptsById(this.identifiers().match(/[0-9]+/g))
					.then(this.appendConcepts, () => { this.conceptLoading(false); })
					.then(() => { this.conceptLoading(false); })
					.then(() => { this.identifiers(''); });
			};

			importSourceCodes () {
				this.conceptLoading(true);
				vocabularyApi
					.getConceptsByCode(this.sourcecodes().match(/[0-9a-zA-Z\.-]+/g))
					.then(this.appendConcepts, () => {
						this.conceptLoading(false);
					})
					.then( () => {
						this.conceptLoading(false);
					})
					.then( () => {
						this.sourcecodes('');
					});
			}

			viewReport (sourceKey, reportName) {
			// TODO: Should we prevent running an analysis on an unsaved cohort definition?
				if (this.model.currentCohortDefinition().id() > 0) {
					this.model.reportCohortDefinitionId(this.model.currentCohortDefinition().id());
					this.model.reportReportName(reportName);
					this.model.reportSourceKey(sourceKey);
					this.model.reportTriggerRun(true);
				}
			}

			reload () {
				if (this.modifiedJSON.length > 0) {
					var updatedExpression = JSON.parse(this.modifiedJSON);
					this.model.currentCohortDefinition().expression(new CohortExpression(updatedExpression));
				}
			}

			async exportConceptSetsCSV () {
				this.exporting(true);
				try {
					await FileService.loadZip(`${config.api.url}cohortdefinition/${this.model.currentCohortDefinition().id()}/export/conceptset`,
						`cohortdefinition-conceptsets-${this.model.currentCohortDefinition().id()}.zip`);
				} catch(e) {
					alert(exceptionUtils.translateException(e));
				}finally {
					this.exporting(false);
				}
			}

			selectViewReport (item) {
				this.selectedSource(item);
				this.loadingReport(true);
				this.selectedReportCaption(item.name);

				var byEventReport = cohortDefinitionService.getReport(this.model.currentCohortDefinition().id(), item.sourceKey, 0);
				var byPersonReport = cohortDefinitionService.getReport(this.model.currentCohortDefinition().id(), item.sourceKey, 1);

				$.when(byEventReport, byPersonReport).done( (byEvent, byPerson) => {
					var report = {sourceKey: item.sourceKey, byEvent: byEvent[0], byPerson: byPerson[0]};
					this.selectedReport(report);
					this.loadingReport(false);
				});
			}

			getStatusMessage (info) {
				if (info.status() === "COMPLETE" && !info.isValid())
					return !info.isCanceled() ? "FAILED" : "CANCELED";
				else
					return info.status();
			}

			getStatusTemplate(item) {
				return item.status === 'FAILED' ? 'failed-status-tmpl' : 'success-status-tmpl';
			}

			showExitMessage(sourceKey) {
				const info = this.model.cohortDefinitionSourceInfo().find(i => i.sourceKey === sourceKey) || { failMessage: 'Failed without any message' };
				this.exitMessage(info.failMessage);
				this.isExitMessageShown(true);
			}

			calculateProgress (j) {
				return j.progress() + '%';
			}

			async generateAnalyses ({ descr, duration, analysisIdentifiers, runHeraclesHeel, periods, rollupUtilizationVisit, rollupUtilizationDrug }) {
				if (!confirm(`This will run ${descr} and may take about ${duration}. Are you sure?`)) {
					return;
				}

				this.generateReportsEnabled(false);
				analysisIdentifiers = _.uniq(analysisIdentifiers);
				var cohortDefinitionId = this.model.currentCohortDefinition().id();
				var cohortJob = {};

				cohortJob.jobName = 'HERACLES_COHORT_' + cohortDefinitionId + '_' + this.model.reportSourceKey();
				cohortJob.sourceKey = this.model.reportSourceKey();
				cohortJob.smallCellCount = 5;
				cohortJob.cohortDefinitionIds = [];
				cohortJob.cohortDefinitionIds.push(cohortDefinitionId);
				cohortJob.analysisIds = analysisIdentifiers;
				cohortJob.runHeraclesHeel = runHeraclesHeel;
				cohortJob.cohortPeriodOnly = false;

				// set concepts
				cohortJob.conditionConceptIds = [];
				cohortJob.drugConceptIds = [];
				cohortJob.procedureConceptIds = [];
				cohortJob.observationConceptIds = [];
				cohortJob.measurementConceptIds = [];

				cohortJob.periods = periods;

				cohortJob.rollupUtilizationVisit = rollupUtilizationVisit;
				cohortJob.rollupUtilizationDrug = rollupUtilizationDrug;

				this.createReportJobFailed(false);
				try {
					this.isReportGenerating(true);
					const { data } = await cohortDefinitionService.getCohortAnalyses(cohortJob);
					jobDetailsService.createJob(data);
				} catch (err) {
					this.createReportJobFailed(true);
					const { status, data } = err;
					const createReportJobErrorPackage = {
						status,
						error: data.payload,
					};
					this.createReportJobError(JSON.stringify(createReportJobErrorPackage));

					// reset button to allow generation attempt
					this.generateReportsEnabled(true);
					this.generateButtonCaption('Generate');
				}
				await this.queryHeraclesJob(this.model.currentCohortDefinition(), this.model.reportSourceKey());
				this.isReportGenerating(false);
			}

			generateQuickAnalysis () {
				this.generateAnalyses({
					descr: 'minimal analyses set to provide a quick overview of the cohort',
					duration: '10 minutes',
					analysisIdentifiers: cohortReportingService.getQuickAnalysisIdentifiers(),
					runHeraclesHeel: false
				});
			}

			selectHealthcareAnalyses () {
				this.showUtilizationToRunModal(true);
			}

			generateHealthcareAnalyses () {
				const analysisIds = this.utilReportOptions.reports.selectedOptions().reduce((acc, ids) => [...acc, ...ids], []);
				this.generateAnalyses({
					descr: 'the Cost and Utilization analyses',
					duration: '10-45 minutes',
					analysisIdentifiers: analysisIds,
					runHeraclesHeel: false,
					periods: this.utilReportOptions.periods.selectedOptions(),
					...this.utilReportOptions.rollups.selectedOptions().reduce((acc, current) => { acc[current] = true; return acc }, {}),
				});

				this.showUtilizationToRunModal(false);
			};

			generateAllAnalyses () {
				this.generateAnalyses({
					descr: 'all analyses',
					duration: '60-90 minutes',
					analysisIdentifiers: cohortReportingService.getAnalysisIdentifiers(),
					runHeraclesHeel: true
				});
			};

		// dispose subscriptions / cleanup computed observables (non-pureComputeds)
			dispose () {
				this.cohortDefinitionLink.dispose();
				this.cohortDefinitionCaption.dispose();
				this.tabPath.dispose();
				this.sortedConceptSets.dispose();
				this.reportingState.dispose();
				this.showReportNameDropdown.dispose();
				this.reportSourceKeySub.dispose();
				this.ancestorsModalIsShown(false);
				PollService.stop(this.pollId);
			}

			getCriteriaIndexComponent (data) {
				data = ko.utils.unwrapObservable(data);
				if (!data) return;
				if (data.hasOwnProperty("ConditionOccurrence"))
					return "condition-occurrence-criteria-viewer";
				else if (data.hasOwnProperty("ConditionEra"))
					return "condition-era-criteria-viewer";
				else if (data.hasOwnProperty("DrugExposure"))
					return "drug-exposure-criteria-viewer";
				else if (data.hasOwnProperty("DrugEra"))
					return "drug-era-criteria-viewer";
				else if (data.hasOwnProperty("DoseEra"))
					return "dose-era-criteria-viewer";
				else if (data.hasOwnProperty("ProcedureOccurrence"))
					return "procedure-occurrence-criteria-viewer";
				else if (data.hasOwnProperty("Observation"))
					return "observation-criteria-viewer";
				else if (data.hasOwnProperty("VisitOccurrence"))
					return "visit-occurrence-criteria-viewer";
				else if (data.hasOwnProperty("DeviceExposure"))
					return "device-exposure-criteria-viewer";
				else if (data.hasOwnProperty("Measurement"))
					return "measurement-criteria-viewer";
				else if (data.hasOwnProperty("Specimen"))
					return "specimen-criteria-viewer";
				else if (data.hasOwnProperty("ObservationPeriod"))
					return "observation-period-criteria-viewer";
				else if (data.hasOwnProperty("PayerPlanPeriod"))
					return "payer-plan-period-criteria-viewer";
				else if (data.hasOwnProperty("Death"))
					return "death-criteria-viewer";
				else if (data.hasOwnProperty("LocationRegion"))
					return "location-region-viewer";
				else
					return "unknownCriteriaType";
			};

			copyExpressionToClipboard () {
				this.copyToClipboard('#btnCopyExpressionClipboard', '#copyExpressionToClipboardMessage');
			}

			copyIdentifierListToClipboard () {
				this.copyToClipboard('#btnCopyIdentifierListClipboard', '#copyIdentifierListMessage');
			}

			copyIncludedConceptIdentifierListToClipboard () {
				this.copyToClipboard('#btnCopyIncludedConceptIdentifierListClipboard', '#copyIncludedConceptIdentifierListMessage');
			}

			copyTextViewToClipboard() {
			    let columns = [
				{
				    title: 'Concept Id',
				    data: 'CONCEPT_ID'
				},
				{
				    title: 'Concept Name',
				    data: 'CONCEPT_NAME'
				},
				{
				    title: 'Domain',
				    data: 'DOMAIN_ID'
				},
				{
				    title: 'Vocabulary',
				    data: 'VOCABULARY_ID'
				}
			    ];
			    let setsText = '';
			    this.sortedConceptSets().forEach((set) => {
				setsText += '\n' + set.name() + '\n';
				columns.forEach((c) => {
				    setsText += c.title + '\t';
				});
				setsText += 'Excluded\tDescendants\tMapped' + '\n';
				set.expression.items().forEach((item) => {
				    columns.forEach((c) => {
				        setsText += item.concept[c.data] + '\t';
				    });
				    setsText += (item.isExcluded() ? 'YES' : 'NO') + '\t';
				    setsText += (item.includeDescendants() ? 'YES' : 'NO') + '\t';
				    setsText += (item.includeMapped() ? 'YES' : 'NO') + '\n';
				});
			    });
			    this.copyToClipboard('#btnCopyTextViewClipboard', '#copyTextViewMessage', setsText);
			}

			copyCohortExpressionJSONToClipboard () {
				this.copyToClipboard('#btnCopyExpressionJSONClipboard', '#copyCohortExpressionJSONMessage');
			}

			copyCohortSQLToClipboard () {
				this.copyToClipboard('#btnCopyCohortSQLClipboard', '#copyCopyCohortSQLMessage');
			}

			getExpressionJson() {
				if (!this.model.currentCohortDefinition()) {
					return ko.toJSON(null);
				}
				return ko.toJSON(this.model.currentCohortDefinition().expression(), (key, value) => {
					// UseEventEnd is a speical case: always include this key in the result.
					if (value === 0 || value || ['UseEventEnd'].indexOf(key) > -1) {
						return value;
					} else {
						return;
					}
				}, 2);
			}

			setExpressionJson(value) {
				this.modifiedJSON = value;
			}

			getDataboundColumn(field, title, width) {
				return {
					data: field,
					title: title,
					width: width,
					render: function (data,type,row) {
						return (type == "display")	? `<span data-bind='text: ${field}'></span>`
																				: ko.utils.unwrapObservable(data)
					}
				}
			}
	}

	return commonUtils.build('cohort-definition-manager', CohortDefinitionManager, view);
});
