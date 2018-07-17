define(['knockout', 'text!./cohort-definition-manager.html',
	'appConfig',
	'cohortbuilder/CohortDefinition',
	'webapi/CohortDefinitionAPI',
	'webapi/MomentAPI',
	'webapi/ConceptSetAPI',
	'components/conceptset/utils',
	'cohortbuilder/CohortExpression',
	'conceptsetbuilder/InputTypes/ConceptSet',
	'webapi/CohortReportingAPI',
	'vocabularyprovider',
	'atlas-state',
	'clipboard',
	'd3',
	'job/jobDetail',
	'pages/cohort-definitions/const',
	'services/ConceptSetService',
	'providers/Component',
	'utils/commonUtils',
	'cohortbuilder/components/FeasibilityReportViewer',
	'databindings',
	'faceted-datatable',
	'databindings/expressionCartoonBinding',
	'cohortfeatures',
	'conceptset-modal',
	'css!./cohort-definition-manager.css',
	'assets/ohdsi.util',
	'cohortbuilder/InclusionRule',
	'webapi/ConceptSetAPI',
	'components/modal-pick-options',
	'components/heading',
], function (
	ko,
	view,
	config,
	CohortDefinition,
	cohortDefinitionAPI,
	momentApi,
	conceptSetApi,
	conceptSetUitls,
	CohortExpression,
	ConceptSet,
	cohortReportingAPI,
	vocabularyApi,
	sharedState,
	clipboard,
	d3,
	jobDetail,
	cohortConst,
	conceptSetService,
	Component,
	commonUtils
) {
	function translateSql(sql, dialect) {
		translatePromise = $.ajax({
			url: config.webAPIRoot + 'sqlrender/translate',
			method: 'POST',
			contentType: 'application/json',
			data: JSON.stringify({
				SQL: sql,
				targetdialect: dialect
			}),
			error: function (error) {
				console.log("Error: " + error);
			}
		});
		return translatePromise;
	}

	function pruneJSON(key, value) {
		if (value === 0 || value) {
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

	class CohortDefinitionManager extends Component {
		constructor(params) {
			super(params);
			var pollTimeout = null;
			var authApi = params.model.authApi;
			this.config = config;
			this.selectedConcepts = sharedState.selectedConcepts;
			this.model = params.model;

			this.cohortDefinitionCaption = ko.computed(() => {
				if (this.model.currentCohortDefinition()) {
					if (this.model.currentCohortDefinition().id() == 0) {
					return 'New Cohort';
				} else {
						return 'Cohort #' + this.model.currentCohortDefinition().id();
				}
			}
			});
			this.isAuthenticated = ko.pureComputed(() => {
				return authApi.isAuthenticated();
			});
			var isNew = ko.pureComputed(() => {
				return !this.model.currentCohortDefinition() || (this.model.currentCohortDefinition().id() == 0);
			});
			this.canEdit = this.model.canEditCurrentCohortDefinition;
			this.canCopy = ko.pureComputed(() => {
				return !isNew() && (this.isAuthenticated() && authApi.isPermittedCopyCohort(this.model.currentCohortDefinition().id()) || !config.userAuthenticationEnabled);
			});
			this.canDelete = ko.pureComputed(() => {
				if (isNew()) {
					return false;
				}
				return ((this.isAuthenticated() && authApi.isPermittedDeleteCohort(this.model.currentCohortDefinition().id()) || !config.userAuthenticationEnabled));
			});
			this.hasAccess = ko.pureComputed(() => {
				if (!config.userAuthenticationEnabled) {
					return true;
				}
				if (!this.isAuthenticated()) {
					return false;
				}
				if (isNew()) {
					return authApi.isPermittedCreateCohort();
				}

				return authApi.isPermittedReadCohort(this.model.currentCohortDefinition().id());
			});
		
			this.hasAccessToGenerate = (sourceKey) => {
				if (isNew()) {
					return false;
				}

				return authApi.isPermittedGenerateCohort(this.model.currentCohortDefinition().id(), sourceKey);
			}
			this.hasAccessToReadCohortReport = (sourceKey) => {
				if (isNew()) {
					return false;
				}

				return this.isAuthenticated() && authApi.isPermittedReadCohortReport(this.model.currentCohortDefinition().id(), sourceKey);
			}
			if (!this.hasAccess()) return;

			this.generatedSql = {};
			this.generatedSql.mssql = ko.observable('');
			this.generatedSql.oracle = ko.observable('');
			this.generatedSql.postgresql = ko.observable('');
			this.generatedSql.redshift = ko.observable('');
			this.generatedSql.msaps = ko.observable('');
			this.generatedSql.impala = ko.observable('');
			this.generatedSql.netezza = ko.observable('');
			this.templateSql = ko.observable('');
			this.tabMode = this.model.currentCohortDefinitionMode;
			this.cohortConst = cohortConst;
			this.generationTabMode = ko.observable("inclusion")
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
			this.isSaveable = ko.pureComputed(() => {
				return this.dirtyFlag() && this.dirtyFlag().isDirty();
			});
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
				return this.dirtyFlag().isDirty() && !this.isRunning() && this.canEdit();
			});

			this.delayedCartoonUpdate = ko.observable(null);

			this.saveConceptSetShow = ko.observable(false);
			this.newConceptSetName = ko.observable();

			this.canGenerate = ko.pureComputed(() => {
				var isDirty = this.dirtyFlag() && this.dirtyFlag().isDirty();
				var isNew = this.model.currentCohortDefinition() && (this.model.currentCohortDefinition().id() == 0);
				var canGenerate = !(isDirty || isNew);
				return (canGenerate);
			});

			this.modifiedJSON = "";
			this.expressionJSON = ko.pureComputed({
				read: () => {
					return ko.toJSON(this.model.currentCohortDefinition().expression(), (key, value) => {
					if (value === 0 || value) {
						return value;
					} else {
						return
					}
				}, 2);
				},
				write: (value) => {
					this.modifiedJSON = value;
				}
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
					render: (s, p, d) => {
					var valid = d.INVALID_REASON_CAPTION == 'Invalid' ? 'invalid' : '';
					return '<a class="' + valid + '" href=\"#/concept/' + d.CONCEPT_ID + '\">' + d.CONCEPT_NAME + '</a>';
				}
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
								return parseInt(o.RECORD_COUNT.toString().replace(',', '')) > 0;
							}
					},
					{
						'caption': 'Has Descendant Records',
							'binding': (o) => {
								return parseInt(o.DESCENDANT_RECORD_COUNT.toString().replace(',', '')) > 0;
							}
					},
				]
		};

			this.stopping = this.model.cohortDefinitionSourceInfo().reduce((acc, target) => ({...acc, [target.sourceKey]: ko.observable(false)}), {});
			this.isSourceStopping = (source) => this.stopping[source.sourceKey];

			this.pollForInfo = () => {
				if (pollTimeout)
					clearTimeout(pollTimeout);

				var id = pageModel.currentCohortDefinition().id();
					cohortDefinitionAPI.getInfo(id).then((infoList) => {
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
							pollTimeout = setTimeout(() => {
								this.pollForInfo();
						}, 1000);
					}
				});
			}
			
			this.isRunning = ko.pureComputed(() => {
				return this.model.cohortDefinitionSourceInfo().filter( (info) => {
					return !(info.status() == "COMPLETE" || info.status() == "n/a");
				}).length > 0;
			});
			
			this.canCreateConceptSet = ko.computed( () => {
				return ((authApi.isAuthenticated() && authApi.isPermittedCreateConceptset()) || !config.userAuthenticationEnabled);
			});
			
			this.cohortDefinitionLink = ko.computed(() => {
				if (this.model.currentCohortDefinition()) {
					return this.config.api.url + "/cohortdefinition/" + this.model.currentCohortDefinition().id();
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
			
			this.model.reportSourceKey.subscribe(s => {
				this.reportingSourceStatusAvailable(false);
				this.reportingAvailableReports.removeAll();
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
						cohortReportingAPI.getCompletedAnalyses(sourceInfo, this.model.currentCohortDefinition().id()).done(results => {
						var reports = cohortReportingAPI.getAvailableReports(results);
						if (reports.length == 0) {
								this.reportingAvailableReports(reports);
								this.generateReportsEnabled(false);
								this.reportingSourceStatusAvailable(true);
								this.reportingSourceStatusLoading(false);
							return "checking_status";
						}
							cohortReportingAPI.getCompletedHeraclesHeelAnalyses(sourceInfo, this.model.currentCohortDefinition().id()).done(heelResults => {
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
					if (this.model.currentCohortDefinition()) {
					var listing = sharedState.jobListing;
						var tempJob = listing().find(this.isActiveJob)
					if (tempJob) {
						if (tempJob.status() == 'STARTED' || tempJob.status() == 'STARTING') {
								this.currentJob(tempJob);
								this.generateReportsEnabled(false);
							return "generating_reports";
						}
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
			
			const reportPacks = cohortReportingAPI.visualizationPacks;
			this.utilReportOptions = [
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
			
			this.selectedCriteria = ko.observable();

			// preserve context to use in knockout bindings
			this.delete = this.delete.bind(this);
			this.save = this.save.bind(this);
			this.close = this.close.bind(this);
			this.copy = this.copy.bind(this);
			this.isSourceRunning = this.isSourceRunning.bind(this);
			this.isSourceStopping = this.isSourceStopping.bind(this);
			this.showSql = this.showSql.bind(this);
			this.getSourceInfo = this.getSourceInfo.bind(this);
			this.getSourceId = this.getSourceId.bind(this);
			this.generateCohort = this.generateCohort.bind(this);
			this.cancelGenerate = this.delete.bind(this);
			this.hasCDM = this.hasCDM.bind(this);
			this.hasResults = this.hasResults.bind(this);
			this.closeConceptSet = this.closeConceptSet.bind(this);
			this.deleteConceptSet = this.deleteConceptSet.bind(this);
			this.showSaveConceptSet = this.showSaveConceptSet.bind(this);
			this.saveConceptSet = this.saveConceptSet.bind(this);
			this.createConceptSet = this.createConceptSet.bind(this);
			this.loadConceptSet = this.loadConceptSet.bind(this);
			this.newConceptSet = this.newConceptSet.bind(this);
			this.importConceptSet = this.importConceptSet.bind(this);
			this.importFromRepository = this.importFromRepository.bind(this);
			this.onConceptSetRepositoryImport = this.onConceptSetRepositoryImport.bind(this);
			this.clearImportConceptSetJson = this.clearImportConceptSetJson.bind(this);
			this.findConceptSet = this.findConceptSet.bind(this);
			this.importConceptSetExpression = this.importConceptSetExpression.bind(this);
			this.importConceptSetExpressionItems = this.importConceptSetExpressionItems.bind(this);
			this.appendConcepts = this.appendConcepts.bind(this);
			this.importConceptIdentifiers = this.importConceptIdentifiers.bind(this);
			this.importSourceCodes = this.importSourceCodes.bind(this);
			this.viewReport = this.viewReport.bind(this);
			this.reload = this.reload.bind(this);
			this.selectViewReport = this.selectViewReport.bind(this);
			this.isActiveJob = this.isActiveJob.bind(this);
			this.generateAnalyses = this.generateAnalyses.bind(this);
			this.generateQuickAnalysis = this.generateQuickAnalysis.bind(this);
			this.selectHealthcareAnalyses = this.selectHealthcareAnalyses.bind(this);
			this.generateHealthcareAnalyses = this.generateHealthcareAnalyses.bind(this);
			this.generateAllAnalyses = this.generateAllAnalyses.bind(this);
			this.dispose = this.dispose.bind(this);
			this.copyExpressionToClipboard = this.copyExpressionToClipboard.bind(this);			
			this.copyIdentifierListToClipboard = this.copyIdentifierListToClipboard.bind(this);
			this.copyIncludedConceptIdentifierListToClipboard = this.copyIncludedConceptIdentifierListToClipboard.bind(this);
			this.copyTextViewToClipboard = this.copyTextViewToClipboard.bind(this);
			this.copyCohortExpressionJSONToClipboard = this.copyCohortExpressionJSONToClipboard.bind(this);
			this.copyCohortSQLToClipboard = this.copyCohortSQLToClipboard.bind(this);
		}

			// METHODS

			delete () {
				if (!confirm("Delete cohort definition? Warning: deletion can not be undone!"))
					return;

				clearTimeout(pollTimeout);

				// reset view after save
					cohortDefinitionAPI.deleteCohortDefinition(this.model.currentCohortDefinition().id()).then( (result) => {
						this.model.currentCohortDefinition(null);
					document.location = "#/cohortdefinitions"
				});
			}

			save () {
				clearTimeout(pollTimeout);
					this.model.clearConceptSet();

				// If we are saving a new cohort definition (id ==0) then clear
				// the id field before saving
					if (this.model.currentCohortDefinition().id() == 0) {
						this.model.currentCohortDefinition().id(undefined);
				}

					var definition = ko.toJS(this.model.currentCohortDefinition());

				// for saving, we flatten the expresson JS into a JSON string
				definition.expression = ko.toJSON(definition.expression, pruneJSON);

				// reset view after save
					cohortDefinitionAPI.saveCohortDefinition(definition).then( (result) => {
					result.expression = JSON.parse(result.expression);
					var definition = new CohortDefinition(result);
						var redirectWhenComplete = definition.id() != this.model.currentCohortDefinition().id();
						this.model.currentCohortDefinition(definition);
					if (redirectWhenComplete) {
						document.location = "#/cohortdefinition/" + definition.id();
					}
				});
			}

			close () {
				if (this.model.currentCohortDefinitionDirtyFlag().isDirty() && !confirm("Your cohort changes are not saved. Would you like to continue?")) {
					return;
				} else {
					document.location = "#/cohortdefinitions"
						this.model.currentConceptSet(null);
						this.model.currentConceptSetDirtyFlag.reset();
						this.model.currentCohortDefinition(null);
						this.model.currentCohortDefinitionDirtyFlag().reset();
						this.model.reportCohortDefinitionId(null);
						this.model.reportReportName(null);
						this.model.reportSourceKey(null);
				}
			}

			copy () {
				clearTimeout(pollTimeout);

				// reset view after save
					cohortDefinitionAPI.copyCohortDefinition(this.model.currentCohortDefinition().id()).then((result) => {
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

				var expression = ko.toJS(this.model.currentCohortDefinition().expression, pruneJSON);
				var templateSqlPromise = cohortDefinitionAPI.getSql(expression);

				templateSqlPromise.then((result) => {
					this.templateSql(result.templateSql);
					var mssqlTranslatePromise = translateSql(result.templateSql, 'sql server');
						mssqlTranslatePromise.then((result) => {
							this.generatedSql.mssql(result.targetSQL);
					});

					var msapsTranslatePromise = translateSql(result.templateSql, 'pdw');
						msapsTranslatePromise.then((result) => {
							this.generatedSql.msaps(result.targetSQL);
					});

					var oracleTranslatePromise = translateSql(result.templateSql, 'oracle');
						oracleTranslatePromise.then((result) => {
							this.generatedSql.oracle(result.targetSQL);
					});

					var postgresTranslatePromise = translateSql(result.templateSql, 'postgresql');
						postgresTranslatePromise.then((result) => {
							this.generatedSql.postgresql(result.targetSQL);
					});

					var redshiftTranslatePromise = translateSql(result.templateSql, 'redshift');
						redshiftTranslatePromise.then((result) => {
							this.generatedSql.redshift(result.targetSQL);
					});

					var impalaTranslatePromise = translateSql(result.templateSql, 'impala');
						impalaTranslatePromise.then((result) => {
							this.generatedSql.impala(result.targetSQL);
					});

					var netezzaTranslatePromise = translateSql(result.templateSql, 'netezza');
					netezzaTranslatePromise.then((result)=> {
							this.generatedSql.netezza(result.targetSQL);
					});

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
				var route = `${config.api.url}cohortdefinition/${this.model.currentCohortDefinition().id()}/generate/${source.sourceKey}`;

				if (includeFeatures) {
					route = `${route}?includeFeatures`;
				}

				this.getSourceInfo(source.sourceKey).status('PENDING');
				if (this.selectedSource() && this.selectedSource().sourceId === source.sourceId) {
					this.loadingReport(true);
				}
				var job = new jobDetail({
					name: this.model.currentCohortDefinition().name() + "_" + source.sourceKey,
					type: 'cohort-generation',
					status: 'PENDING',
					executionId: String(this.model.currentCohortDefinition().id()) + String(this.getSourceId(source.sourceKey)),
					statusUrl: this.config.api.url + 'cohortdefinition/' + this.model.currentCohortDefinition().id() + '/info',
					statusValue: 'status',
					viewed: false,
					url: 'cohortdefinition/' + this.model.currentCohortDefinition().id() + '/generation',
				});

				$.ajax(route, {
					error: authApi.handleAccessDenied,
						success:  (data) => {
						job.status(data.status);
						sharedState.jobListing.queue(job);
							setTimeout( () => {
								this.pollForInfo();
						}, 3000);
					}
				});
			}

			cancelGenerate (source) {
				this.stopping[source.sourceKey](true);
				cohortDefinitionAPI.cancelGenerate(this.model.currentCohortDefinition().id(), source.sourceKey);
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

			showSaveConceptSet () {
				this.newConceptSetName(this.model.currentConceptSet().name());
				this.saveConceptSetShow(true);
			};

			saveConceptSet () {
				this.saveConceptSetShow(false);
      	var conceptSet = {
        	id: 0,
					name: this.newConceptSetName(),
      	};
				var conceptSetItems = conceptSetUitls.toConceptSetItems(this.selectedConcepts());
				var conceptSetId;
				var itemsPromise = (data) => {
					conceptSetId = data.id;
					return conceptSetApi.saveConceptSetItems(data.id, conceptSetItems);
				};
				conceptSetApi.saveConceptSet(conceptSet)
					.then(itemsPromise);
    	};

			createConceptSet() {
				var newConceptSet = new ConceptSet();
				var cohortConceptSets = this.model.currentCohortDefinition().expression().ConceptSets;
				newConceptSet.id = cohortConceptSets().reduce(function(max, val) { return Math.max(max, val.id) + 1; }, 0);
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

			onConceptSetRepositoryImport (newConceptSet, event) {
				event.stopPropagation();
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

				items.forEach((item)=> {
					var conceptSetItem = {};
					conceptSetItem.concept = item.concept;
					conceptSetItem.isExcluded = ko.observable(item.isExcluded);
					conceptSetItem.includeDescendants = ko.observable(item.includeDescendants);
					conceptSetItem.includeMapped = ko.observable(item.includeMapped);

					sharedState.selectedConceptsIndex[item.concept.CONCEPT_ID] = 1;
					sharedState.selectedConcepts.push(conceptSetItem);
				});
				conceptSet.expression.items.valueHasMutated();
				this.clearImportConceptSetJson();
				this.conceptSetTabMode(cohortConst.conceptSetTabModes.details);
			};

			appendConcepts(data) {
				data.forEach((item) => {
					sharedState.selectedConceptsIndex[item.CONCEPT_ID] = 1;
						sharedState.selectedConcepts.push(this.model.createConceptSetItem(item));
				});
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

			exportConceptSetsCSV () {
				window.open(config.api.url + 'cohortdefinition/' + this.model.currentCohortDefinition().id() + '/export/conceptset');
			}

			selectViewReport (item) {
				this.selectedSource(item);
				this.loadingReport(true);
				this.selectedReportCaption(item.name);

				cohortDefinitionAPI.getReport(this.model.currentCohortDefinition().id(), item.sourceKey).then( (report) => {
				report.sourceKey = item.sourceKey;
					this.selectedReport(report);
					this.loadingReport(false);
				});
			}

			getStatusMessage (info) {
				if (info.status() == "COMPLETE" && !info.isValid())
					return "FAILED";
				else
					return info.status();
			}

			calculateProgress (j) {
				return j.progress() + '%';
			}

			isActiveJob (j) {
				var testName = "HERACLES_COHORT_" + this.model.currentCohortDefinition().id() + "_" + this.model.reportSourceKey();
				return j.name == testName && j.status() != 'FAILED' && j.status() != 'COMPLETED';
			}			

			generateAnalyses ({ descr, duration, analysisIdentifiers, runHeraclesHeel }) {
				if (!confirm(`This will run ${descr} and may take about ${duration}. Are you sure?`)) {
					return;
				}

				this.generateReportsEnabled(false);
				analysisIdentifiers = _.uniq(analysisIdentifiers);
				var cohortDefinitionId = pageModel.currentCohortDefinition().id();
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

				var jobDetails = new jobDetail({
					name: cohortJob.jobName,
					status: 'LOADING',
					executionId: null,
						statusUrl: this.config.api.url + 'job/execution/',
					statusValue: 'status',
					progress: 0,
						progressUrl: this.config.api.url + 'cohortresults/' + this.model.reportSourceKey() + '/' + cohortDefinitionId + '/info',
					progressValue: 'progress',
					progressMax: 100,
					viewed: false,
						url: 'cohortdefinition/' + cohortDefinitionId + '/reporting?sourceKey=' + this.model.reportSourceKey(),
				});

					this.createReportJobFailed(false);

				$.ajax({
					url: config.api.url + 'cohortanalysis',
					data: JSON.stringify(cohortJob),
					method: 'POST',
					context: jobDetails,
					contentType: 'application/json',
						success: (info) => {
						this.executionId = info.executionId;
						this.status(info.status);
						this.statusUrl = this.statusUrl + info.executionId;
						sharedState.jobListing.queue(this);
					},
						error: (xhr, status, error) => {
							this.createReportJobFailed(true);
							var createReportJobErrorPackage = {};
							createReportJobErrorPackage.status = status;
							createReportJobErrorPackage.error = xhr.responseText;
							this.createReportJobError(JSON.stringify(createReportJobErrorPackage));

						// reset button to allow generation attempt
							this.generateReportsEnabled(true);
							this.generateButtonCaption('Generate');
					}
				});
			}

			generateQuickAnalysis () {
				this.generateAnalyses({
					descr: 'minimal analyses set to provide a quick overview of the cohort',
					duration: '10 minutes',
					analysisIdentifiers: cohortReportingAPI.getQuickAnalysisIdentifiers(),
					runHeraclesHeel: false
				});
			}

			selectHealthcareAnalyses () {
				this.showUtilizationToRunModal(true);
			}

			generateHealthcareAnalyses () {
				const analysisIds = this.checkedUtilReports().reduce((acc, ids) => [...acc, ...ids], []);

				this.generateAnalyses({
					descr: 'the Cost and Utilization analyses',
					duration: '10-45 minutes',
					analysisIdentifiers: analysisIds,
					runHeraclesHeel: false
				});

				this.showUtilizationToRunModal(false);
			};

			generateAllAnalyses () {
				this.generateAnalyses({
					descr: 'all analyses',
					duration: '60-90 minutes',
					analysisIdentifiers: cohortReportingAPI.getAnalysisIdentifiers(),
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
				else
					return "unknownCriteriaType";
			};

			copyToClipboard (clipboardButtonId, clipboardButtonMessageId) {
				var currentClipboard = new clipboard(clipboardButtonId);

				currentClipboard.on('success', (e) => {
					console.log('Copied to clipboard');
					e.clearSelection();
					$(clipboardButtonMessageId).fadeIn();
						setTimeout(() => {
						$(clipboardButtonMessageId).fadeOut();
					}, 1500);
				});

				currentClipboard.on('error', (e) => {
					console.log('Error copying to clipboard');
					console.log(e);
				});
			}

			copyExpressionToClipboard () {
				this.copyToClipboard('#btnCopyExpressionClipboard', '#copyExpressionToClipboardMessage');
			}

			copyIdentifierListToClipboard () {
				this.copyToClipboard('#btnCopyIdentifierListClipboard', '#copyIdentifierListMessage');
			}

			copyIncludedConceptIdentifierListToClipboard () {
				this.copyToClipboard('#btnCopyIncludedConceptIdentifierListClipboard', '#copyIncludedConceptIdentifierListMessage');
			}

			copyTextViewToClipboard () {
				this.copyToClipboard('#btnCopyTextViewClipboard', '#copyTextViewMessage');
			}

			copyCohortExpressionJSONToClipboard () {
				this.copyToClipboard('#btnCopyExpressionJSONClipboard', '#copyCohortExpressionJSONMessage');
			}

			copyCohortSQLToClipboard () {
				this.copyToClipboard('#btnCopyCohortSQLClipboard', '#copyCopyCohortSQLMessage');
			}
		
	}

	return commonUtils.build('cohort-definition-manager', CohortDefinitionManager, view);
});
