define(['jquery', 'knockout', 'text!./cohort-definition-manager.html',
	'appConfig',
	'components/cohortbuilder/CohortDefinition',
	'services/CohortDefinition',
	'services/MomentAPI',
	'services/ConceptSet',
	'services/Permission',
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
	'services/Sample',
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
	'services/http',
	'const',
	'./const',
	'components/security/access/const',
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
	'./components/reporting/cohort-reports/cohort-reports',
	'components/security/access/configure-access-modal',
	
], function (
	$,
	ko,
	view,
	config,
	CohortDefinition,
	cohortDefinitionService,
	momentApi,
	conceptSetService,
	PermissionService,
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
	sampleService,
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
	httpService,
	globalConstants,
	constants,
	{ entityType },
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

	function gender(code) {
		if(code==8507) return 'Male'
		if(code==8532) return 'Female'
		else return "Other"
	}

	function mapSampleListData(originalData) {
		return originalData.map(el => {
			let selectionCriteria;
			let mode;
			if(el.age) {
				switch (el.age.mode) {
					case 'between':
						mode = 'Between'
						break;
					case 'notBetween':
						mode = 'Not between'
						break;
					case 'lessThan':
						mode= 'Less than'
						break;
					case 'lessThanOrEqual':
						mode= 'Less than or equal'
						break;
					case 'equalTo':
						mode= 'Equal'
						break;
					case 'greaterThan':
						mode= 'Greater than'
						break;
					case 'greaterThanOrEqual':
						mode= 'Greater than or equal'
						break;
					default:
						break;
				}
			} else {
				mode = ''
			}
			if((mode=='Between'||mode=='Not between')&& el.age) {
				selectionCriteria = `${mode} ${el.age.min} and ${el.age.max}`
			} else if(el.age) {
				selectionCriteria = `${mode} ${el.age.value}`
			} else {
				selectionCriteria = 'Random age'
			}
			if(el.gender.otherNonBinary&&el.gender.conceptIds.length==2) {
				selectionCriteria =`Mix, ${selectionCriteria}`
			} else {
				if (el.gender.otherNonBinary) {
					selectionCriteria = `Other, ${selectionCriteria}`
				}
				if (el.gender.conceptIds[0]) {
					selectionCriteria =  `${gender(el.gender.conceptIds[0])}, ${selectionCriteria}`
				}
				if (el.gender.conceptIds[1]) {
					selectionCriteria =  `${gender(el.gender.conceptIds[1])}, ${selectionCriteria}`
				}
			}
			const sampleId = el.id;
			const sampleName = el.name || ''
			const patientCounts = el.size
			const createdBy = el.createdBy && el.createdBy.name || ''
			const createdOn = new Date(el.createdDate).toLocaleString()
			return {
				sampleId,
				sampleName,
				selectionCriteria, 
				patientCounts,
				createdBy, 
				createdOn,
			}
		})
	}

	class CohortDefinitionManager extends AutoBind(Clipboard(Page)) {
		constructor(params) {
			super(params);
			this.pollTimeout = null;
			this.authApi = authApi;
			this.config = config;
			this.selectedConcepts = sharedState.selectedConcepts;
			this.loadingIncluded = sharedState.loadingIncluded;
			this.loadingSourcecodes = sharedState.loadingSourcecodes;
			this.relatedSourcecodesOptions = globalConstants.relatedSourcecodesOptions;
			this.commonUtils = commonUtils;
			this.includedConcepts = sharedState.includedConcepts;
			this.includedSourcecodes = sharedState.includedSourcecodes;
			this.currentIncludedConceptIdentifierList = sharedState.currentIncludedConceptIdentifierList;
			this.isLoading = ko.observable(false);
			this.currentCohortDefinition = sharedState.CohortDefinition.current;
			this.currentCohortDefinitionMode = sharedState.CohortDefinition.mode;
			this.currentCohortDefinitionInfo = sharedState.CohortDefinition.info;
			this.cohortDefinitionSourceInfo = sharedState.CohortDefinition.sourceInfo;
			this.dirtyFlag = sharedState.CohortDefinition.dirtyFlag;
			this.currentConceptSetExpressionJson = sharedState.currentConceptSetExpressionJson;
			this.sourceAnalysesStatus = {};
			this.criteriaContext = sharedState.criteriaContext;
			this.reportCohortDefinitionId = ko.observable();
			this.reportSourceKey = ko.observable();
			this.reportReportName = ko.observable();
			this.loadingReport = ko.observable(false);
			this.reportTriggerRun = ko.observable(false);
			this.currentConceptIdentifierList = sharedState.currentConceptIdentifierList;
			this.resolvingConceptSetExpression = sharedState.resolvingConceptSetExpression;
			this.tabMode = sharedState.CohortDefinition.mode;
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

			// sample states
			this.showSampleCreatingModal = ko.observable(false)
			this.sampleSourceKey = ko.observable()
			this.isSampleGenerating = ko.observable(false)
			this.isLoadingSampleData = ko.observable(false)
			this.cohortDefinitionIdOnRoute=ko.observable()
			// new sample state
			this.newSampleCreatingLoader = ko.observable(false)
			this.sampleName=ko.observable('')
			this.patientCount=ko.observable()
			this.sampleAgeType = ko.observable('')
			this.isAgeRange =ko.observable(false)
			this.firstAge = ko.observable()
			this.secondAge = ko.observable()
			this.isMaleSample=ko.observable(false)
			this.isFeMaleSample=ko.observable(false)
			this.isOtherGenderSample=ko.observable(false)
			//error state
			this.isAgeRangeError = ko.observable()
			this.firstAgeError = ko.observable()
			this.sampleNameError=ko.observable()
			this.patientCountError=ko.observable()
			//reset sample state after closing
			this.showSampleCreatingModal.subscribe(val =>{
				if(!val) this.resetSampleForm()
			})
			
			//sampleSourceKey changes => get list of samples
			this.sampleSourceKey.subscribe(val => {
				const cohortId = this.currentCohortDefinition()?
					this.currentCohortDefinition().id():
				 	this.cohortDefinitionIdOnRoute()
				if(!val) {
					history.pushState(null, '', `#/cohortdefinition/${cohortId}/samples`)
					return
				};
				history.pushState(null, '', `#/cohortdefinition/${cohortId}/samples/${val}`)
				this.getSampleList(cohortId)
			})

			//validation input value
			this.sampleAgeType.subscribe(val => {
				this.isAgeRange(val=='between'||val=='notBetween')
			})
			this.isAgeRange.subscribe(val => {
					this.firstAgeError(undefined)
					this.isAgeRangeError(undefined)
					this.firstAge(null)
					this.secondAge(null)
			})
			this.secondAge.subscribe(val => {
				let secondAge;
				if(val!=null) {
					secondAge = Number(val)
			 } else {
				secondAge == val
			 }
				if(secondAge==null&&this.firstAge()==null) {
					this.isAgeRangeError(undefined)
					this.firstAgeError(undefined)
					return
				}
				if (this.isAgeRange()) {
					if(!Number.isInteger(secondAge)||secondAge<0||!this.firstAge()||!secondAge||secondAge==this.firstAge()) {
						this.isAgeRangeError(true)
					} else {
						this.isAgeRangeError(false)
					}
				} else {
					this.isAgeRangeError(undefined)
				}
			})

			this.firstAge.subscribe(val => {
				let firstAge;
				if(val!=null) {
					 firstAge = Number(val)
				} else {
					firstAge == val
				}
				if(firstAge==null&&this.secondAge()==null) {
					this.isAgeRangeError(undefined)
					this.firstAgeError(undefined)
					return
				}
				
				if(this.isAgeRange()) {
					if(!Number.isInteger(firstAge)||!this.secondAge()||!secondAge||firstAge<0||firstAge==this.secondAge()) {
						this.isAgeRangeError(true)
					} else {
						this.isAgeRangeError(false)
					}
				} 

				if(!this.isAgeRange()) {
					if(!Number.isInteger(firstAge)||firstAge<0) {
						this.firstAgeError(true)
					} else {
						this.firstAgeError(false)
					}
				} 
			})
			
			this.sampleName.subscribe(val =>{ 
				if(!val.trim()) {
					this.sampleNameError(true)
				} else {
					this.sampleNameError(false)
				}
			})

			this.patientCount.subscribe(val =>{
				if(!val||!Number.isInteger(Number(val))||Number(val)<=0) {
					this.patientCountError(true)
				} else {
					this.patientCountError(false)
				}
			})
			//sample list
			this.sampleListCols = [
				{
					title: 'Sample Id',
					data:'sampleId',
					visible: false,
				},
        {
          title: 'Sample name',
					render: datatableUtils.getLinkFormatter(d => ({
						label: d['sampleName'],
						linkish: true,
					})),
        },
        {
          title: 'Number of patients',
          data: 'patientCounts',
        },
        {
          title: 'Selection criteria',
          data: 'selectionCriteria',
        },
        {
          title: 'Created by',
          data: 'createdBy',
				},
				{
					title: 'Created on',
					data: 'createdOn'
				},
				{
					title: 'Delete',
					sortable: false,
					render: function() {return `<i class="sample-list fa fa-trash" aria-hidden="true"></i>`}
				}
			]
			this.sampleList = ko.observableArray()

			// Sample data table
			this.sampleCols =  [
				{
					title: '',
					sortable: false,
					data: 'selected',
					render: function(d) {
						return `<span data-bind="css: { selected: ${d}}" class="sample-select fa fa-check"></span>`
					}
				},
        {
					title: 'Person ID',
					render: datatableUtils.getLinkFormatter(d => ({
						label: d['personId'],
						linkish: true,
					})),
				},
				{
					title: 'Gender',
					data: 'gender',
				},
				{
					title: 'Age at index',
					data: 'ageIndex',
				},
				{
					title: 'Number of events',
					data: 'eventCounts',
				}
			]
			this.selectedSampleId = ko.observable('')
			this.selectedSampleName = ko.observable('')
			this.sampleDataLoading = ko.observable(false)
			this.sampleData =ko.observableArray([])
			
			this.isCohortGenerated = ko.computed(() => {
				const sourceInfo = this.cohortDefinitionSourceInfo().find(d => d.sourceKey == this.sampleSourceKey());
				if (sourceInfo&&this.getStatusMessage(sourceInfo) == 'COMPLETE') {
					return true
				}
				return false
			})
			//end of sample states

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
				if (this.currentCohortDefinition()) {
					if (this.currentCohortDefinition().id() == 0) {
					return this.defaultName;
				} else {
						return 'Cohort #' + this.currentCohortDefinition().id();
				}
			}
			});
			this.isNameFilled = ko.computed(() => {
				return this.currentCohortDefinition() && this.currentCohortDefinition().name();
			});

			this.isNameCorrect = ko.computed(() => {
				return this.isNameFilled() && this.currentCohortDefinition().name() !== this.defaultName;
			});
			this.isAuthenticated = ko.pureComputed(() => {
				return this.authApi.isAuthenticated();
			});
			this.isNew = ko.pureComputed(() => {
				return !this.currentCohortDefinition() || (this.currentCohortDefinition().id() == 0);
			});
			this.canEdit = ko.pureComputed(() => {
				if (!authApi.isAuthenticated()) {
					return false;
				}

				if (this.currentCohortDefinition() && (this.currentCohortDefinition()
						.id() != 0)) {
					return authApi.isPermittedUpdateCohort(this.currentCohortDefinition()
						.id()) || !config.userAuthenticationEnabled;
				} else {
					return authApi.isPermittedCreateCohort() || !config.userAuthenticationEnabled;
				}
			});
			this.isSaving = ko.observable(false);
			this.isCopying = ko.observable(false);
			this.isDeleting = ko.observable(false);
			this.isProcessing = ko.computed(() => {
			    return this.isSaving() || this.isCopying() || this.isDeleting();
			});
			this.canCopy = ko.pureComputed(() => {
				return !this.dirtyFlag().isDirty() && !this.isNew() &&
					(this.isAuthenticated() && this.authApi.isPermittedCopyCohort(this.currentCohortDefinition().id()) || !config.userAuthenticationEnabled);
			});
			this.canDelete = ko.pureComputed(() => {
				if (this.isNew()) {
					return false;
				}
				return ((this.isAuthenticated() && this.authApi.isPermittedDeleteCohort(this.currentCohortDefinition().id()) || !config.userAuthenticationEnabled));
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

				return this.authApi.isPermittedReadCohort(this.currentCohortDefinition().id());
			});

			this.hasAccessToGenerate = (sourceKey) => {
				if (this.isNew()) {
					return false;
				}

				return this.authApi.isPermittedGenerateCohort(this.currentCohortDefinition().id(), sourceKey);
			}
			this.hasAccessToReadCohortReport = (sourceKey) => {
				return this.isAuthenticated() && this.authApi.isPermittedReadCohortReport(this.currentCohortDefinition().id(), sourceKey);
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
			this.cohortConst = cohortConst;
			this.generationTabMode = ko.observable("inclusion");
			this.inclusionTabMode = ko.observable("person");
			this.exportTabMode = ko.observable('printfriendly');
			this.importTabMode = ko.observable(cohortConst.importTabModes.identifiers);
			this.exportSqlMode = ko.observable('ohdsisql');
			this.importConceptSetJson = ko.observable();
			this.conceptSetTabMode = sharedState.currentConceptSetMode;
			this.conceptSetTabMode.subscribe(conceptSetService.onCurrentConceptSetModeChanged)
			this.showImportConceptSetModal = ko.observable(false);
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
				return this.dirtyFlag().isDirty() || this.currentCohortDefinition().expression().ConceptSets().length === 0;
			});

			this.disableConceptSetExportMessage = ko.pureComputed(() => {
				if (this.currentCohortDefinition().expression().ConceptSets().length === 0) {
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
				var isNew = this.currentCohortDefinition() && (this.currentCohortDefinition().id() == 0);
				const hasInitialEvent = this.currentCohortDefinition().expression().PrimaryCriteria().CriteriaList().length > 0;
				var canGenerate = !(isDirty || isNew) && hasInitialEvent;
				return (canGenerate);
			});

			this.modifiedJSON = "";
			Object.defineProperty(this, 'expressionJSON', {
				get: () => this.getExpressionJson(),
				set: (val) => this.setExpressionJson(val),
			});

			this.selectedSource = ko.observable();
			this.selectedReportSource = ko.observable();

			this.sortedConceptSets = ko.computed((d) => {
				if (this.currentCohortDefinition() != null) {
					var clone = this.currentCohortDefinition().expression().ConceptSets().slice(0);
					return clone.sort(conceptSetSorter);
				}
			});

		// model behaviors
			this.onConceptSetTabRespositoryConceptSetSelected = (conceptSet) => {
				this.showImportConceptSetModal(false);
				this.loadConceptSet(conceptSet.id);
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
			this.relatedSourcecodesColumns = globalConstants.getRelatedSourcecodesColumns(sharedState, { canEditCurrentConceptSet: this.canEdit });
			this.ancestors = ko.observableArray();
			this.ancestorsModalIsShown = ko.observable(false);
			this.showAncestorsModal = conceptSetService.getAncestorsModalHandler({
				sharedState,
				ancestors: this.ancestors,
				ancestorsModalIsShown: this.ancestorsModalIsShown,
			});

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
			this.stopping = ko.pureComputed(() => this.cohortDefinitionSourceInfo().reduce((acc, target) => ({...acc, [target.sourceKey]: ko.observable(false)}), {}));
			this.isSourceStopping = (source) => this.stopping()[source.sourceKey];

			this.pollForInfo = () => {
				if (this.pollTimeout) {
					clearTimeout(this.pollTimeout);
					this.pollTimeout = null;
				}

				if (this.currentCohortDefinition()) {
					var id = this.currentCohortDefinition().id();
					cohortDefinitionService.getInfo(id).then((infoList) => {
						var hasPending = false;

							infoList.forEach((info) => {
							// obtain source reference
								var source = this.cohortDefinitionSourceInfo().filter((cdsi) => {
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
											if (this.selectedReportSource() && source.sourceId === this.selectedReportSource().sourceId) {
												this.selectedReportSource(null);
										}
									} else {
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
				return this.cohortDefinitionSourceInfo().filter( (info) => {
					return !(info.status() == "COMPLETE" || info.status() == "n/a");
				}).length > 0;
			});

			this.canCreateConceptSet = ko.computed( () => {
				return ((this.authApi.isAuthenticated() && this.authApi.isPermittedCreateConceptset()) || !config.userAuthenticationEnabled);
			});

			this.cohortDefinitionLink = ko.computed(() => {
				if (this.currentCohortDefinition()) {
					return commonUtils.normalizeUrl(this.config.api.url, "cohortdefinition", this.currentCohortDefinition().id());
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


			this.reportingState = ko.computed(() => {
				// require a data source selection
					if (this.reportSourceKey() == undefined) {
						this.generateReportsEnabled(false);
					return "awaiting_selection";
				}

				// check if the cohort has been generated
					var sourceInfo = this.cohortDefinitionSourceInfo().find(d => d.sourceKey == this.reportSourceKey());
					if (this.getStatusMessage(sourceInfo) != 'COMPLETE') {
						this.generateReportsEnabled(false);
					return "cohort_not_generated";
				}

				// check which reports have required data
					if (!this.reportingSourceStatusAvailable() && !this.reportingSourceStatusLoading()) {
						this.reportingSourceStatusLoading(true);
						cohortReportingService.getCompletedAnalyses(sourceInfo, this.currentCohortDefinition().id()).done(results => {
						var reports = cohortReportingService.getAvailableReports(results);
						if (reports.length == 0) {
								this.reportingAvailableReports(reports);
								this.generateReportsEnabled(false);
								this.reportingSourceStatusAvailable(true);
								this.reportingSourceStatusLoading(false);
							return "checking_status";
						}
							cohortReportingService.getCompletedHeraclesHeelAnalyses(sourceInfo, this.currentCohortDefinition().id()).done(heelResults => {
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
				if (this.currentCohortDefinition() && this.currentJob()) {
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

					if (this.reportReportName() == undefined) {
					// reset button to allow regeneration
						this.generateReportsEnabled(true);
					return "awaiting_selection";
				}

					if (this.currentCohortDefinition()) {
						this.generateReportsEnabled(true);
						this.reportCohortDefinitionId(this.currentCohortDefinition().id());
						this.reportTriggerRun(true);
					return "report_active";
				}

				var errorPackage = {};
					errorPackage.sourceAnalysesStatus = this.sourceAnalysesStatus[this.reportSourceKey()]();
					errorPackage.report = this.reportReportName();
					this.reportingError(JSON.stringify(errorPackage));
				// reset button to allow regeneration
					this.generateReportsEnabled(false);
				return "unknown_cohort_report_state";
			});

			this.showReportNameDropdown = ko.computed(() => {
				return this.reportSourceKey() != undefined &&
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

			this.currentConceptSet = sharedState.ConceptSet.current;
			this.currentConceptSetDirtyFlag = sharedState.ConceptSet.dirtyFlag;
			this.currentConceptSetSource = sharedState.ConceptSet.source;

			this.reportSourceKeySub = this.reportSourceKey.subscribe(source => {
				PollService.stop(this.pollId);
				this.reportReportName(null);
				this.reportingSourceStatusAvailable(false);
				this.reportingAvailableReports.removeAll();
				const cd = this.currentCohortDefinition();
				source && this.startPolling(cd, source);
			});
			this.reportsManagerComponentParams = {
				reportSourceKey: this.reportSourceKey,

			}
			PermissionService.decorateComponent(this, {
				entityTypeGetter: () => entityType.COHORT_DEFINITION,
				entityIdGetter: () => this.currentCohortDefinition().id(),
				createdByUsernameGetter: () => this.currentCohortDefinition() && this.currentCohortDefinition().createdBy()
			});

			this.tabMode.subscribe(mode => {
				if(mode&&this.currentCohortDefinition()&&mode!=='samples') {
					const cohortId = this.currentCohortDefinition().id()
					// use push state to prevent the component to re-render
					history.pushState(null, '', `#/cohortdefinition/${cohortId}`)
				}
			})
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
					cohortDefinitionService.deleteCohortDefinition(this.currentCohortDefinition().id()).
                    then( (result) => {
						this.currentCohortDefinition(null);
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
				const result = window.confirm('Modify cohort definition will delete all created samples, do you still want to proceed?')
				if(!result) return
				
				this.isSaving(true);
				clearTimeout(this.pollTimeout);

				// Next check to see that a cohort definition with this name does not already exist
				// in the database. Also pass the id so we can make sure that the
				// current Cohort Definition is excluded in this check.

				try {
					const results = await cohortDefinitionService.exists(this.currentCohortDefinition().name(), this.currentCohortDefinition().id());
					if (results > 0) {
						alert('A cohort definition with this name already exists. Please choose a different name.');
					} else {
						this.clearConceptSet();

						// If we are saving a new cohort definition (id === 0) then clear
						// the id field before saving
						if (this.currentCohortDefinition().id() === "0") {
							this.currentCohortDefinition().id(undefined);
						}
						var definition = ko.toJS(this.currentCohortDefinition());

						// reset view after save
						const savedDefinition = await cohortDefinitionService.saveCohortDefinition(definition);
						definition = new CohortDefinition(savedDefinition);
						const redirectWhenComplete = definition.id() != this.currentCohortDefinition().id();
						this.currentCohortDefinition(definition);
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
				if (this.dirtyFlag().isDirty() && !confirm("Your cohort changes are not saved. Would you like to continue?")) {
					return;
				} else {
					commonUtils.routeTo('/cohortdefinitions');
					this.currentConceptSet(null);
					this.currentConceptSetDirtyFlag().reset();
					this.currentCohortDefinition(null);
					this.dirtyFlag().reset();
					this.reportCohortDefinitionId(null);
					this.reportReportName(null);
					this.reportSourceKey(null);
				}
			}
			copy () {
				this.isCopying(true);
				clearTimeout(this.pollTimeout);
				// reset view after save
				cohortDefinitionService.copyCohortDefinition(this.currentCohortDefinition().id()).then((result) => {
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

				var templateSqlPromise = this.service.getSql(ko.toJS(this.currentCohortDefinition().expression, pruneJSON));

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

			getSourceKeyInfo (sourceKey) {
				return this.cohortDefinitionSourceInfo().filter((d) => {
					return d.sourceKey == sourceKey
				})[0];
			}

			getSourceId (sourceKey) {
				return sharedState.sources().find(source => source.sourceKey === sourceKey).sourceId;
			}

			generateCohort (source, includeFeatures) {
				this.stopping()[source.sourceKey](false);
				this.getSourceKeyInfo(source.sourceKey).status('PENDING');
				if (this.selectedSource() && this.selectedSource().sourceId === source.sourceId) {
					this.toggleCohortReport(null);
				}
				cohortDefinitionService.generate(this.currentCohortDefinition().id(), source.sourceKey, includeFeatures)
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
				this.stopping()[source.sourceKey](true);
				cohortDefinitionService.cancelGenerate(this.currentCohortDefinition().id(), source.sourceKey);
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
				conceptSetService.clearConceptSet();
			}

			deleteConceptSet () {
				this.currentCohortDefinition().expression().ConceptSets.remove((item) => {
					return item.id == this.currentConceptSet().id;
				});
				this.closeConceptSet();
			}

			removeConceptSet(id) {
				this.currentCohortDefinition().expression().ConceptSets.remove(
					function (item) {
						return item.id === id;
					}
				);
			}

			removeInclusionRule(name) {
				this.currentCohortDefinition().expression().InclusionRules.remove(
					(item) => item.name() === name
				);
			}

			fixConceptSet(warning) {
				if (warning.type === 'ConceptSetWarning' && warning.conceptSetId >= 0) {
					this.removeConceptSet(warning.conceptSetId);
				} else if (warning.type === 'IncompleteRuleWarning' && warning.ruleName) {
					this.removeInclusionRule(warning.ruleName);
				}
			}

			showSaveConceptSet () {
				this.newConceptSetName(this.currentConceptSet().name());
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
				var cohortConceptSets = this.currentCohortDefinition().expression().ConceptSets;
				newConceptSet.id = cohortConceptSets().length > 0 ? Math.max(...cohortConceptSets().map(c => c.id)) + 1 : 0;
				return newConceptSet;
			}

			prepareConceptSet(conceptSet) {
				var cohortConceptSets = this.currentCohortDefinition().expression().ConceptSets;
				cohortConceptSets.push(conceptSet);
				this.loadConceptSet(conceptSet.id);
				this.currentCohortDefinitionMode("conceptsets");
			}

			newConceptSet () {
				this.prepareConceptSet(this.createConceptSet());
			};

			importConceptSet () {
				this.prepareConceptSet(this.createConceptSet());
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
				return this.currentCohortDefinition()
					.expression()
					.ConceptSets()
						.find((item) => {
							return item.id === this.currentConceptSet().id;
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
				this.loadConceptSet(conceptSet.id);
				this.clearImportConceptSetJson();
			};

			appendConcepts(response) {
				var conceptSetItemsToAdd = sharedState.selectedConcepts();
				sharedState.clearSelectedConcepts();
				response.data.forEach((item) => {
					if (sharedState.selectedConceptsIndex[item.CONCEPT_ID] != 1) {
						sharedState.selectedConceptsIndex[item.CONCEPT_ID] = 1;
						conceptSetItemsToAdd.push(commonUtils.createConceptSetItem(item));
					}
				});
				sharedState.selectedConcepts(conceptSetItemsToAdd);
				conceptSetService.resolveConceptSetExpression(true);
				if (this.currentCohortDefinition() && this.currentConceptSetSource() === "cohort") {
					var conceptSet = this.currentCohortDefinition()
						.expression()
						.ConceptSets()
							.find( (item) => {
								return item.id === this.currentConceptSet().id;
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
				if (this.currentCohortDefinition().id() > 0) {
					this.reportCohortDefinitionId(this.currentCohortDefinition().id());
					this.reportReportName(reportName);
					this.reportSourceKey(sourceKey);
					this.reportTriggerRun(true);
				}
			}

			onRouterParamsChanged(params) {
				const { cohortDefinitionId, conceptSetId, mode = 'definition', sourceKey, sampleId } = params;
				console.log('params change', cohortDefinitionId, conceptSetId, mode , sourceKey)
				this.cohortDefinitionIdOnRoute(cohortDefinitionId)
				this.clearConceptSet();
				this.tabMode(mode);
				if(sourceKey) {
					this.sampleSourceKey(sourceKey)
				}
				if(sampleId) {
					this.selectedSampleId(sampleId)
					this.fetchSampleData({sampleId, sourceKey, cohortDefinitionId})
				}
				if (!this.checkifDataLoaded(cohortDefinitionId, conceptSetId, sourceKey)) {
					this.prepareCohortDefinition(cohortDefinitionId, conceptSetId, sourceKey);
				}
			}

			getSourceInfo(source) {
				const info = this.currentCohortDefinitionInfo();
				for (var i = 0; i < info.length; i++) {
					if (info[i].id.sourceId == source.sourceId) {
						return info[i];
					}
				}
			}

			getCDSI(source, sourceInfo) {
				let cdsi = {};
				cdsi.name = source.sourceName;
				cdsi.sourceKey = source.sourceKey;
				if (sourceInfo != null) {
					cdsi.isValid = ko.observable(sourceInfo.isValid);
					cdsi.isCanceled = ko.observable(sourceInfo.isCanceled);
					cdsi.sourceId = sourceInfo.id.sourceId;
					cdsi.status = ko.observable(sourceInfo.status);
					const date = new Date(sourceInfo.startTime);
					cdsi.startTime = ko.observable(momentApi.formatDateTime(date));
					cdsi.executionDuration = ko.observable(momentApi.formatDuration(sourceInfo.executionDuration));
					const commaFormatted = d3.format(",");
					if (sourceInfo.personCount == null) {
						cdsi.personCount = ko.observable('...');
					} else {
						cdsi.personCount = ko.observable(commaFormatted(sourceInfo.personCount));
					}
					if (sourceInfo.recordCount) {
						cdsi.recordCount = ko.observable(commaFormatted(sourceInfo.recordCount));
					} else {
						cdsi.recordCount = ko.observable('...');
					}
					cdsi.includeFeatures = ko.observable(sourceInfo.includeFeatures);
					cdsi.failMessage = ko.observable(sourceInfo.failMessage);
				} else {
					cdsi.isValid = ko.observable(false);
					cdsi.isCanceled = ko.observable(false);
					cdsi.status = ko.observable('n/a');
					cdsi.startTime = ko.observable('n/a');
					cdsi.executionDuration = ko.observable('n/a');
					cdsi.personCount = ko.observable('n/a');
					cdsi.recordCount = ko.observable('n/a');
					cdsi.includeFeatures = ko.observable(false);
					cdsi.failMessage = ko.observable(null);
				}
				return cdsi;
			}

			async loadRequiredData(conceptSetId, sourceKey) {
				try {
					if (this.currentCohortDefinition().expression().ConceptSets()) {
						const identifiers = [];
						this.currentCohortDefinition().expression().ConceptSets().forEach((identifier) => {
							identifier.expression.items().forEach((item) => {
								identifiers.push(item.concept.CONCEPT_ID);
							});
						});
						const { data: identifiersResult } = await httpService.doPost(sharedState.vocabularyUrl() + 'lookup/identifiers', identifiers);
						let conceptsNotFound = 0;
						const identifiersByConceptId = new Map();
						identifiersResult.forEach(c => identifiersByConceptId.set(c.CONCEPT_ID, c));

						this.currentCohortDefinition().expression().ConceptSets().forEach((currentConceptSet) => {
						// Update each of the concept set items
							currentConceptSet.expression.items().forEach((item) => {
								const selectedConcept = identifiersByConceptId.get(item.concept.CONCEPT_ID);
								if (selectedConcept) {
									item.concept = selectedConcept;
								} else {
									conceptsNotFound++;
								}
							});
							currentConceptSet.expression.items.valueHasMutated();
						});
						if (conceptsNotFound > 0) {
							console.error("Concepts not found: " + conceptsNotFound);
						}
						this.dirtyFlag().reset();
					}
					// now that we have required information lets compile them into data objects for our view
					const cdmSources = sharedState.sources().filter(commonUtils.hasCDM);
					let results = [];
					for (let s = 0; s < cdmSources.length; s++) {
						const source = cdmSources[s];
						this.sourceAnalysesStatus[source.sourceKey] = ko.observable({
							ready: false,
							checking: false
						});
						const sourceInfo = this.getSourceInfo(source);
						let cdsi = this.getCDSI(source, sourceInfo);
						results.push(cdsi);
					}
					this.cohortDefinitionSourceInfo(results);

					if (conceptSetId != null) {
						await this.loadConceptSet(conceptSetId);
						return;
					} else {
						this.reportSourceKey(sourceKey);
					}
				} catch(er) {
					console.error(er);
				}
			}

			async prepareCohortDefinition(cohortDefinitionId, conceptSetId, sourceKey) {
				this.isLoading(true);
				if(parseInt(cohortDefinitionId) === 0) {
					this.setNewCohortDefinition();
				} else {
					await this.loadExistingCohortDefinition(cohortDefinitionId);
				}
				await this.loadRequiredData(conceptSetId, sourceKey);
				this.isLoading(false);
			}

			setNewCohortDefinition() {
				this.currentCohortDefinition(new CohortDefinition({ id: '0', name: 'New Cohort Definition' }));
				this.currentCohortDefinitionInfo([]);

			}

			async loadExistingCohortDefinition(id) {
				try {
					const cohortDefinition = await cohortDefinitionService.getCohortDefinition(id);
					const generationInfo = await cohortDefinitionService.getInfo(id);
					this.currentCohortDefinition(new CohortDefinition(cohortDefinition));
					this.currentCohortDefinitionInfo(generationInfo);
				} catch (err) {
					console.error(err);
				}
			}

			clearConceptSet() {
				conceptSetService.clearConceptSet();
			}

			checkifDataLoaded(cohortDefinitionId, conceptSetId, sourceKey) {
				if (this.currentCohortDefinition() && this.currentCohortDefinition().id() == cohortDefinitionId) {
					if (this.currentConceptSet() && this.currentConceptSet().id == conceptSetId && this.currentConceptSetSource() == 'cohort') {
						this.reportSourceKey(sourceKey);
						return true;
					} else if (conceptSetId != null) {
						this.loadConceptSet(conceptSetId);
						return true;
					} else {
						this.reportSourceKey(sourceKey);
						return true;
					}
				}
				return false;
			}

			loadConceptSet(conceptSetId) {
				this.currentConceptSetSource('cohort');
				this.conceptSetTabMode('details');
				const conceptSet = this.currentCohortDefinition()
					.expression()
					.ConceptSets()
					.find(item => item.id == conceptSetId);
				let conceptPromise;
				if (conceptSet.expression.items() && conceptSet.expression.items()
					.length > 0 && !conceptSet.expression.items()[0].concept.STANDARD_CONCEPT) {
					var identifiers = Array.from(conceptSet.expression.items())
						.map(() => {
							return this.concept.CONCEPT_ID;
						});
					conceptPromise = conceptSetService.lookupIdentifiers(identifiers)
						.then(({ data }) => {
							for (var i = 0; i < data.length; i++) {
								conceptSet.expression.items()[i].concept = data[i];
							}
							conceptSet.expression.items.valueHasMutated();
						});
				} else {
					conceptPromise = Promise.resolve();
				}
				conceptPromise
					.then(() => {
						// Reconstruct the expression items
						for (var i = 0; i < conceptSet.expression.items().length; i++) {
							sharedState.selectedConceptsIndex[conceptSet.expression.items()[i].concept.CONCEPT_ID] = 1;
						}
						sharedState.selectedConcepts(conceptSet.expression.items());
						this.currentConceptSet({
							name: conceptSet.name,
							id: conceptSet.id
						});
						conceptSetService.resolveConceptSetExpression();
					});
			}

			reload () {
				if (this.modifiedJSON.length > 0) {
					var updatedExpression = JSON.parse(this.modifiedJSON);
					this.currentCohortDefinition().expression(new CohortExpression(updatedExpression));
				}
			}

			async exportConceptSetsCSV () {
				this.exporting(true);
				try {
					await FileService.loadZip(`${config.api.url}cohortdefinition/${this.currentCohortDefinition().id()}/export/conceptset`,
						`cohortdefinition-conceptsets-${this.currentCohortDefinition().id()}.zip`);
				} catch(e) {
					alert(exceptionUtils.translateException(e));
				}finally {
					this.exporting(false);
				}
			}

			toggleCohortReport(item) {
				if (this.selectedReportSource() && this.selectedReportSource().sourceKey === item.sourceKey) {
					this.selectedReportSource(null);
				} else {
					this.selectedReportSource(item);
				}
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
				const info = this.cohortDefinitionSourceInfo().find(i => i.sourceKey === sourceKey) || { failMessage: 'Failed without any message' };
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
				var cohortDefinitionId = this.currentCohortDefinition().id();
				var cohortJob = {};

				cohortJob.jobName = `HERACLES_COHORT_${cohortDefinitionId}_${this.reportSourceKey()}`;
				cohortJob.sourceKey = this.reportSourceKey();
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
				await this.queryHeraclesJob(this.currentCohortDefinition(), this.reportSourceKey());
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
				if (!this.currentCohortDefinition()) {
					return ko.toJSON(null);
				}
				return ko.toJSON(this.currentCohortDefinition().expression(), (key, value) => {
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
			// samples methods
			clickSampleTab() {
				this.tabMode('samples')
				const cohortId = this.currentCohortDefinition().id()
				history.pushState(null, '', `#/cohortdefinition/${cohortId}/samples`)
			}
			addNewSample() {
				this.showSampleCreatingModal(true)
			}

			validateSampleForm() {
				// if a mandotory field is not yet filled at all, it should be error
				if(this.sampleNameError()==undefined) this.sampleNameError(true)
				if(this.patientCountError()==undefined) this.patientCountError(true)
				if(!this.isAgeRange()) {
					// not-madatory field
					if(this.firstAgeError()==undefined) this.firstAgeError(false);
					if(!this.firstAgeError()&&!this.sampleNameError()&&!this.patientCountError()) {
						return true
					}
					return false
				} else {
					// not madatory field
					if(this.isAgeRangeError()==undefined) this.isAgeRangeError(false)
					if(!this.isAgeRangeError()&&!this.sampleNameError()&&!this.patientCountError()) {
						return true
					} 
					return false
				}
			}

			resetSampleForm() {
				this.sampleName('')
				this.patientCount('')
				this.sampleAgeType('lessThan')
				this.firstAge(null)
				this.secondAge(null)
				this.isMaleSample(false)
				this.isFeMaleSample(false)
				this.isOtherGenderSample(false)
			
				this.isAgeRangeError(undefined)
				this.firstAgeError(undefined)
				this.sampleNameError(undefined)
				this.patientCountError(undefined)
				this.isAgeRange(false)
			}

			createNewSample() {
				const allValidated = this.validateSampleForm()
				if(!allValidated) return
				// create Sample
				const cohortDefinitionId =this.currentCohortDefinition().id();
				const sourceKey=this.sampleSourceKey()
				const name = this.sampleName();
				const size = Number(this.patientCount());
				const ageMode = this.sampleAgeType();
				let conceptIds = [];
				let otherNonBinary = false
				const selectAllGender = !this.isMaleSample()&&!this.isFeMaleSample()&&!this.isOtherGenderSample()
				if(this.isMaleSample()||selectAllGender) {
					conceptIds.push(8507)
				}
				if(this.isFeMaleSample()||selectAllGender) {
					conceptIds.push(8532)	
				}
				if(this.isOtherGenderSample()||selectAllGender) {
					otherNonBinary = true
				}

				const firstAge = Number(this.firstAge());
				const secondAge = Number(this.secondAge());
				let age;
				if(this.firstAge()==null&&this.secondAge()==null) {
					age = null
				} else {
					age = {
						value: this.isAgeRange()?null:firstAge,
						mode: ageMode,
						min:this.isAgeRange()? firstAge<secondAge?firstAge:secondAge : null,
						max:this.isAgeRange()? firstAge<secondAge?secondAge:firstAge : null
					}
				}

				const	payload = {
						name,
						size,
						age,
						gender: {otherNonBinary, conceptIds}
					}
				this.newSampleCreatingLoader(true)
				sampleService.createSample(payload, {cohortDefinitionId, sourceKey})
				.then(res => {
					console.log('res', res)
					if(res.ok) {
						const newData= mapSampleListData([res.data])
						this.sampleList.unshift(...newData)
						this.showSampleCreatingModal(false)
					}
					//close pop-up
				})
				.catch((error) => {
					console.error(error)
					alert('Error when creating sample, please try again later')
				})
				.finally(() => {
					this.newSampleCreatingLoader(false)
				})
			}

			getSampleList(cohortId) {
				this.isLoadingSampleData(true)
				const cohortDefinitionId= cohortId || this.currentCohortDefinition().id();
				// if (cohortDefinitionId==0) return
				const sourceKey=this.sampleSourceKey()
				sampleService.getSampleList({cohortDefinitionId, sourceKey})
				.then(res => {
					const sampleListData = mapSampleListData(res)
					console.log(sampleListData)
					this.sampleList(sampleListData)
				})
				.catch(error=>{
					console.error(error)
					alert('Error when fetching sample list, please try again later')
				})
				.finally(() => {
					this.isLoadingSampleData(false)
				})
			}

			onSampleListRowClick(d, e) {
				// find index of click
				const {sampleId} = d;
				const rowIndex = this.sampleList().findIndex(el=>el.sampleId == sampleId)

				const cohortDefinitionId= this.currentCohortDefinition().id();
				const sourceKey=this.sampleSourceKey();
				if(e.target.className=='sample-list fa fa-trash') {
					//TODO: Delete row
					sampleService.deleteSample({cohortDefinitionId, sourceKey, sampleId})
					.then(res=>{
						if(res.ok) {
							this.sampleList.splice(rowIndex, 1)
						} 
					})
					.catch(() => {
						alert('Error when deleting sample, please try again later')
					})
				} else {
					//TODO: details sample
					this.fetchSampleData({sampleId, sourceKey, cohortDefinitionId})
				}
			}

			fetchSampleData({sampleId, sourceKey, cohortDefinitionId}) {
				this.sampleDataLoading(true)
				sampleService.getSample({ cohortDefinitionId, sourceKey, sampleId })
				.then(res=>{
					this.selectedSampleId(sampleId)
					this.selectedSampleName(res.name)
					this.showSampleDataTable(res.elements)
					history.pushState(null, '', `#/cohortdefinition/${cohortDefinitionId}/samples/${sourceKey}/${sampleId}`)
				})
				.catch(error => {
					console.error(error);
					alert('Error when fetching sample data, please try again later')
				})
				.finally(() => {
					this.sampleDataLoading(false)
				})
			}

			onSampleDataClick(d) {
				const selectedPatients = this.sampleData().filter(el=>el.selected).map(el=>el.personId);
				//change checkbox state
				// this.sampleData.replace(d, {...d, selected: !d.selected})

				if (selectedPatients.includes(d.personId)) {
					this.sampleData.replace(d, { ...d, selected: !d.selected })
				} else {
					if (selectedPatients.length == 2) {
						alert('You can only select maximum 2 patients')
						return
					}
					this.sampleData.replace(d, { ...d, selected: !d.selected })
				}
			}

			showSampleDataTable(sample) {
				const transformedSampleData = sample.map(el => ({
					personId: el.personId,
					gender: gender(el.genderConceptId),
					ageIndex: el.age,
					eventCounts: el.recordCount || '',
					selected: false
				}))

				this.sampleData(transformedSampleData);
			}

			viewSamplePatient() { 
				const sampleId = this.selectedSampleId()
				const cohortDefinitionId= this.currentCohortDefinition().id();
				const sourceKey=this.sampleSourceKey();
				const selectedPatients = this.sampleData().filter(el=>el.selected).map(el=>el.personId);
				if(selectedPatients.length==0) {
					alert('You must select one or two patients to proceed')
				}
				if(selectedPatients[1]) {
					window.open(`#/profiles/${sourceKey}/${selectedPatients[0]}/${cohortDefinitionId}/${sampleId}/${selectedPatients[1]}`)
				}
				window.open(`#/profiles/${sourceKey}/${selectedPatients[0]}/${cohortDefinitionId}/${sampleId}`)
			}
	}

	return commonUtils.build('cohort-definition-manager', CohortDefinitionManager, view);
});
