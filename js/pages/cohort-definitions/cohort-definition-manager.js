define(['jquery', 'knockout', 'text!./cohort-definition-manager.html',
	'appConfig',
	'components/cohortbuilder/CohortDefinition',
	'services/CohortDefinition',
	'services/MomentAPI',
	'services/ConceptSet',
	'services/Permission',
	'services/Tags',
	'components/conceptset/utils',
	'utils/DatatableUtils',
	'components/cohortbuilder/CohortExpression',
	'components/conceptset/InputTypes/ConceptSet',
	'components/conceptset/ConceptSetStore',
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
	'services/JobPollService',
	'services/file',
	'services/http',
	'const',
	'./const',
	'components/security/access/const',
	'components/conceptset/utils',
	'components/cohortbuilder/components/FeasibilityReportViewer',
	'databindings',
	'faceted-datatable',
	'databindings/expressionCartoonBinding',
	'components/checks/warnings',
	'components/checks/warnings-badge',
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
	'components/tags/modal/tags-modal',
	'components/authorship',
	'utilities/sql',
	'components/conceptset/conceptset-list',
	'components/name-validation',
	'components/versions/versions'
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
	TagsService,
	conceptSetUitls,
	datatableUtils,
	CohortExpression,
	ConceptSet,
	ConceptSetStore,
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
	{PollService},
	JobPollService,
	FileService,
	httpService,
	globalConstants,
	constants,
	{ entityType },
	conceptSetUtils,
) {
	const includeKeys = ["UseEventEnd"];
	function pruneJSON(key, value) {
		if (value === 0 || value || includeKeys.includes(key) ) {
			return value;
		}
	}

	function conceptSetSorter(a, b) {
		const textA = a.name().toUpperCase();
		const textB = b.name().toUpperCase();
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
				selectionCriteria = 'Any age'
			}
			if(el.gender.otherNonBinary&&el.gender.conceptIds.length==2) {
				selectionCriteria =`Any Gender, ${selectionCriteria}`
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

			this.previewVersion = sharedState.CohortDefinition.previewVersion;
		    
			this.pollTimeoutId = null;
			this.authApi = authApi;
			this.config = config;
			this.enablePermissionManagement = config.enablePermissionManagement;	    
			this.relatedSourcecodesOptions = globalConstants.relatedSourcecodesOptions;
			this.commonUtils = commonUtils;
			this.isLoading = ko.observable(false);
			this.currentCohortDefinition = sharedState.CohortDefinition.current;
			this.currentCohortDefinitionMode = sharedState.CohortDefinition.mode;
			this.currentCohortDefinitionInfo = sharedState.CohortDefinition.info;
			this.cohortDefinitionSourceInfo = sharedState.CohortDefinition.sourceInfo;
			this.dirtyFlag = sharedState.CohortDefinition.dirtyFlag;
			this.conceptSets = ko.computed(() => this.currentCohortDefinition() && this.currentCohortDefinition().expression().ConceptSets);
			this.conceptSetStore = ConceptSetStore.getStore(ConceptSetStore.sourceKeys().cohortDefinition);
			this.sourceAnalysesStatus = {};
			this.reportCohortDefinitionId = ko.observable();
			this.reportSourceKey = ko.observable();
			this.reportReportName = ko.observable();
			this.loadingReport = ko.observable(false);
			this.reportTriggerRun = ko.observable(false);
			this.tabMode = sharedState.CohortDefinition.mode;
			this.isExitMessageShown = ko.observable();
			this.exitMessage = ko.observable();
			this.service = cohortDefinitionService;
			this.defaultName = ko.unwrap(globalConstants.newEntityNames.cohortDefinition);
			this.isReportGenerating = ko.observable(false);

			// sample states
			this.showSampleCreatingModal = ko.observable(false);
			this.sampleSourceKey = ko.observable();
			this.isSampleGenerating = ko.observable(false);
			this.isLoadingSampleData = ko.observable(false);
			this.cohortDefinitionIdOnRoute=ko.observable();
			// new sample state
			this.newSampleCreatingLoader = ko.observable(false);
			this.sampleName=ko.observable('');
			this.patientCount=ko.observable();
			this.sampleAgeType = ko.observable('');
			this.firstAge = ko.observable();
			this.secondAge = ko.observable();
			this.isMaleSample=ko.observable(false);
			this.isFeMaleSample=ko.observable(false);
			this.isOtherGenderSample=ko.observable(false);
			//error state
			this.sampleNameError=ko.pureComputed(() => this.sampleName().trim() == "");
			this.patientCountError=ko.pureComputed(() => !(this.patientCount() > 0)); // this works because null == 0
			this.isAgeRange =ko.pureComputed(() => ['between','notBetween'].includes(this.sampleAgeType()));
			this.firstAgeError = ko.pureComputed(() => this.firstAge() != null && this.firstAge() < 0);
			this.isAgeRangeError = ko.pureComputed(() => this.isAgeRange() // age range selected
						&& !(this.firstAge() == null && this.secondAge() == null) // one is non-null
						&& (this.firstAge() == null || this.secondAge() == null || this.firstAge() < 0 || this.secondAge() < 0 || this.firstAge() == this.secondAge())); //  has invalid value

			//sampleSourceKey changes => get list of samples
			this.trackSub(this.sampleSourceKey.subscribe(val => {
				const cohortId = this.currentCohortDefinition() ? this.currentCohortDefinition().id() : this.cohortDefinitionIdOnRoute();
				if (val) {
					history.pushState(null, '', `#/cohortdefinition/${cohortId}/samples/${val}`);
					this.getSampleList(cohortId);
				}
			}));

			//validation input value

			//sample list
			this.sampleListCols = [
				{
					title: ko.i18n('columns.sampleId', 'Sample Id'),
					data:'sampleId',
					visible: false,
				},
        {
          title: ko.i18n('columns.sampleName', 'Sample name'),
					render: datatableUtils.getLinkFormatter(d => ({
						label: d['sampleName'],
						linkish: true,
					})),
        },
        {
          title: ko.i18n('columns.numberOfPatients', 'Number of patients'),
          data: 'patientCounts',
        },
        {
          title: ko.i18n('columns.selectionCriteria', 'Selection criteria'),
          data: 'selectionCriteria',
        },
        {
          title: ko.i18n('columns.author', 'Author'),
          data: 'createdBy',
				},
				{
					title: ko.i18n('columns.created', 'Created'),
					data: 'createdOn'
				},
				{
					title: ko.i18n('columns.action', 'Action'),
					sortable: false,
					render: function() {return `<i class="sample-list fa fa-trash" aria-hidden="true"></i> <i class="sample-list fa fa-refresh" aria-hidden="true"></i>`}
				}
			]
			this.sampleList = ko.observableArray()

			// Sample data table
			this.sampleCols =  [
        {
					title: ko.i18n('columns.personId', 'Person ID'),
					render: datatableUtils.getLinkFormatter(d => ({
						label: d['personId'],
						linkish: true,
					})),
				},
				{
					title: ko.i18n('columns.gender', 'Gender'),
					data: 'gender',
				},
				{
					title: ko.i18n('columns.ageAtIndex', 'Age at index'),
					data: 'ageIndex',
				}
			];

			this.selectedSampleId = ko.observable('');
			this.selectedSampleName = ko.observable('');
			this.sampleDataLoading = ko.observable(false);
			this.sampleData =ko.observableArray([]);

			this.isCohortGenerated = ko.pureComputed(() => {
				const sourceInfo = this.cohortDefinitionSourceInfo().find(d => d.sourceKey == this.sampleSourceKey());
				if (sourceInfo&&this.getStatusMessage(sourceInfo) == 'COMPLETE') {
					return true;
				}
				return false;
			});

			//end of sample states

			this.cdmSources = ko.pureComputed(() => {
				return sharedState.sources().filter((source) => commonUtils.hasCDM(source) && authApi.hasSourceAccess(source.sourceKey));
			});

			this.cohortDefinitionCaption = ko.pureComputed(() => {
				if (this.currentCohortDefinition()) {
					if (this.currentCohortDefinition().id() === 0 || this.currentCohortDefinition().id() === null) {
						return this.defaultName;
					} else if (this.previewVersion()) {
						return ko.i18nformat('cohortDefinitions.cohortCaptionPreview', 'Cohort #<%=id%> - Version <%=number%> Preview', {id: this.currentCohortDefinition().id(), number: this.previewVersion().version})();
					} else {
						return ko.i18nformat('cohortDefinitions.cohortCaption', 'Cohort #<%=id%>', {id: this.currentCohortDefinition().id()})();
					}
				}
			});
			this.isNameFilled = ko.pureComputed(() => {
				return this.currentCohortDefinition() && this.currentCohortDefinition().name() && this.currentCohortDefinition().name().trim();
			});
			this.isNameCharactersValid = ko.pureComputed(() => {
				return this.isNameFilled() && commonUtils.isNameCharactersValid(this.currentCohortDefinition().name());
			});
			this.isNameLengthValid = ko.pureComputed(() => {
				return this.isNameFilled() && commonUtils.isNameLengthValid(this.currentCohortDefinition().name());
			});
			this.isDefaultName = ko.pureComputed(() => {
				return this.isNameFilled() && this.currentCohortDefinition().name().trim() === this.defaultName;
			});

			this.isNameCorrect = ko.pureComputed(() => {
				return this.isNameFilled() && !this.isDefaultName() && this.isNameCharactersValid() && this.isNameLengthValid();
			});
			this.isAuthenticated = ko.pureComputed(() => {
				return this.authApi.isAuthenticated();
			});
			this.isNew = ko.pureComputed(() => {
				return !this.currentCohortDefinition() || (this.currentCohortDefinition().id() === 0);
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
				if (this.currentCohortDefinition() && this.isNew()) {
					return this.authApi.isPermittedCreateCohort();
				}

				return this.authApi.isPermittedReadCohorts() ||
					(this.currentCohortDefinition() && this.authApi.isPermittedReadCohort(this.currentCohortDefinition().id()));
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

			this.renderCountColumn = datatableUtils.renderCountColumn;

			this.exportSqlService = this.exportSql;

			this.cohortConst = cohortConst;
			this.generationTabMode = ko.observable("inclusion");
			this.inclusionTabMode = ko.observable("person");
			this.exportTabMode = ko.observable('printfriendly');
			this.importTabMode = ko.observable(cohortConst.importTabModes.identifiers);
			this.conceptSetTabMode = sharedState.currentConceptSetMode;
			this.showImportConceptSetModal = ko.observable(false);
			this.sharedState = sharedState;
			this.identifiers = ko.observable();
			this.sourcecodes = ko.observable();
			this.conceptLoading = ko.observable(false);
			this.conceptSetName = ko.observable();
			this.tabPath = ko.pureComputed(() => {
				var path = this.tabMode();
				if (path === 'export') {
						path += '/' + this.exportTabMode();
				}
				return path;
			});
			this.trackSub(this.exportTabMode.subscribe(val => {
				if (val === 'cartoon') {
					setTimeout(() => {
						this.delayedCartoonUpdate('ready');
					}, 10);
				}
			}));
			this.canSave = ko.pureComputed(()=> {
				return (this.canEdit() && this.previewVersion()) || (this.dirtyFlag().isDirty() && !this.isRunning() && this.canEdit() && this.isNameCorrect());
			});

			this.disableConceptSetExport = ko.pureComputed(() => {
				return this.dirtyFlag().isDirty() || (this.currentCohortDefinition() && this.currentCohortDefinition().expression()	&&
					this.currentCohortDefinition().expression().ConceptSets().length === 0);
			});

			this.disableConceptSetExportMessage = ko.pureComputed(() => {
				if (this.currentCohortDefinition() && this.currentCohortDefinition().expression().ConceptSets().length === 0) {
					return ko.i18n('cohortDefinitions.noConceptSets', 'No concept sets to export');
				}
				if (this.dirtyFlag().isDirty()) {
					return ko.i18n('cohortDefinitions.saveDefinitionBefore', 'You must save the definition before you can export');
				}
			});

			this.delayedCartoonUpdate = ko.observable(null);

			this.saveConceptSetShow = ko.observable(false);
			this.newConceptSetName = ko.observable();

			this.canGenerate = ko.pureComputed(() => {
				var isDirty = this.dirtyFlag() && this.dirtyFlag().isDirty();
				var isNew = this.currentCohortDefinition() && (this.currentCohortDefinition() && this.currentCohortDefinition().id() == 0);
				const hasInitialEvent = this.currentCohortDefinition() && this.currentCohortDefinition().expression().PrimaryCriteria().CriteriaList().length > 0;
				const isValid = this.criticalCount() <= 0;
				var canGenerate = !(isDirty || isNew) && hasInitialEvent && isValid;
				return (canGenerate);
			});

			this.generateDisabledReason = ko.pureComputed(() => {
				if (this.criticalCount() > 0) return ko.unwrap(globalConstants.disabledReasons.INVALID_DESIGN);
				const hasInitialEvent = this.currentCohortDefinition() && this.currentCohortDefinition().expression().PrimaryCriteria().CriteriaList().length > 0;
				if (!hasInitialEvent) return ko.unwrap(globalConstants.disabledReasons.EMPTY_INITIAL_EVENT);
				if (this.dirtyFlag().isDirty()) return ko.unwrap(globalConstants.disabledReasons.DIRTY);
				return null;
			});

			this.criticalCount = ko.observable(0);
			this.isDiagnosticsRunning = ko.observable(false);

			this.warningParams = ko.observable({
				current: sharedState.CohortDefinition.current,
				warningsTotal: ko.observable(0),
				warningCount: ko.observable(0),
				infoCount: ko.observable(0),
				criticalCount: this.criticalCount,
				changeFlag: ko.pureComputed(() => this.dirtyFlag().isChanged()),
				isDiagnosticsRunning: this.isDiagnosticsRunning,
				onDiagnoseCallback: this.diagnose.bind(this),
				onFixCallback: this.fixConceptSet,
			});

			this.modifiedJSON = "";
			Object.defineProperty(this, 'expressionJSON', {
				get: () => this.getExpressionJson(),
				set: (val) => this.setExpressionJson(val),
			});

			this.selectedSource = ko.observable();
			this.selectedReportSource = ko.observable();
			this.tableOptions = commonUtils.getTableOptions('L');
			this.sortedConceptSets = ko.pureComputed((d) => {
				if (this.currentCohortDefinition() != null) {
					var clone = this.currentCohortDefinition().expression().ConceptSets().slice(0);
					return clone.sort(conceptSetSorter);
				}
			});

			// print-friendly state
			this.printFriendlyHtml = ko.observable();
			this.printFriendlyLoading = ko.observable(false);

			// model behaviors
			this.onConceptSetTabRespositoryConceptSetSelected = (conceptSet) => {
				this.showImportConceptSetModal(false);
				this.loadConceptSet(conceptSet.id);
			}

			this.includedConceptsOptions = {
				Facets: [
					{
					'caption': ko.i18n('facets.caption.vocabulary', 'Vocabulary'),
						'binding': (o) => {
							return o.VOCABULARY_ID;
						}
					},
					{
						'caption': ko.i18n('facets.caption.class', 'Class'),
							'binding': (o) => {
							return o.CONCEPT_CLASS_ID;
						}
					},
					{
						'caption': ko.i18n('facets.caption.domain', 'Domain'),
							'binding': (o) => {
								return o.DOMAIN_ID;
							}
					},
					{
						'caption': ko.i18n('facets.caption.standardConcept', 'Standard Concept'),
							'binding': (o) => {
								return o.STANDARD_CONCEPT_CAPTION;
							}
					},
					{
						'caption': ko.i18n('facets.caption.invalidReason', 'Invalid Reason'),
							'binding': (o) => {
								return o.INVALID_REASON_CAPTION;
							}
					},
					{
						'caption': ko.i18n('facets.caption.hasRecords', 'Has Records'),
							'binding': (o) => {
								return parseInt(o.RECORD_COUNT) > 0;
							}
					},
					{
						'caption': ko.i18n('facets.caption.hasDescendantRecords', 'Has Descendant Records'),
							'binding': (o) => {
								return parseInt(o.DESCENDANT_RECORD_COUNT) > 0;
							}
					},
				]
			};


			this.sourcesTableOptions = commonUtils.getTableOptions('S');
			this.sourcesColumns = [{
				title: `<span>${ko.i18n('cohortDefinitions.cohortDefinitionManager.panels.sourceName', 'Source Name')()}</span>`,
				data: 'name'
			}, {
				title: ko.i18n('cohortDefinitions.cohortDefinitionManager.panels.generationStatus', 'Generation Status'),
				data: 'status'
			}, {
				title: ko.i18n('cohortDefinitions.cohortDefinitionManager.panels.people', 'People'),
				data: 'personCount'
			}, {
				title: ko.i18n('cohortDefinitions.cohortDefinitionManager.panels.records', 'Records'),
				data: 'recordCount'
			}, {
				title: ko.i18n('cohortDefinitions.cohortDefinitionManager.panels.generated', 'Generated'),
				data: 'startTime'
			}, {
				title: ko.i18n('cohortDefinitions.cohortDefinitionManager.panels.generationDuration', 'Generation Duration'),
				data: 'executionDuration'
			}, {
				sortable: false,
				className: 'generation-buttons-column',
				render: () => `<span data-bind="template: { name: 'generation-buttons', data: $data }"></span>`
			}];

			this.stopping = ko.pureComputed(() => this.cohortDefinitionSourceInfo().reduce((acc, target) => ({...acc, [target.sourceKey]: ko.observable(false)}), {}));
			this.isSourceStopping = (source) => this.stopping()[source.sourceKey];

			this.pollForInfoPeriodically = () => {
				this.pollTimeoutId = PollService.add({
					callback: () => this.pollForInfo(),
					interval: config.pollInterval,
				});
			}

			this.pollForInfo = () => {
				const { PENDING, RUNNING } = globalConstants.generationStatuses;
				if (this.currentCohortDefinition() && !this.isNew() && this.cohortDefinitionSourceInfo().some(i => [PENDING, RUNNING].includes(i.status()))) {
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
                                if(source.status() !== info.status) {
                                    JobPollService.isJobListMutated(true);
                                }
								source.status(info.status);
								source.isValid(info.isValid);
								source.startTime(momentApi.formatDateTime(new Date(info.startTime)));
								source.createdBy(info.createdBy ? info.createdBy.login : null);

								if (info.status != "COMPLETE" && info.status != "FAILED") {
									// hasPending = true;
									if (this.selectedReportSource() && source.sourceId === this.selectedReportSource().sourceId) {
										this.selectedReportSource(null);
									}
									source.executionDuration('...');
									source.personCount('...');
									source.recordCount('...');
								} else {
									var commaFormatted = d3.format(",");
									source.executionDuration(momentApi.formatDuration(info.executionDuration));
									source.personCount(commaFormatted(info.personCount));
									source.recordCount(commaFormatted(info.recordCount));
									source.failMessage(info.failMessage);
								}
							}
						});
					});
				}
			}

			this.isRunning = ko.pureComputed(() => {
				return this.cohortDefinitionSourceInfo().filter( (info) => {
					return !(info.status() == "COMPLETE" || info.status() == "n/a");
				}).length > 0;
			});

			this.cohortDefinitionLink = ko.pureComputed(() => {
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
			this.showOnlySourcesWithResults = ko.observable(false);
			this.isGenerated = ko.observable(false);
			this.reportOptionCaption = ko.pureComputed(() => {
				return this.reportingSourceStatusLoading()
					? ko.i18n('common.loading', 'Loading Reports...')()
					: ko.i18n('cohortDefinitions.cohortDefinitionManager.selectReport', 'Select a Report')();
			});
			this.reportingSourceStatus = ko.observable();
			this.reportingAvailableReports = ko.observableArray();

			this.pollId = null;
			this.shouldUpdateJobs = ko.computed(() => {
				if (this.generateReportsEnabled()) {
				  JobPollService.isJobListMutated(true);
				}
			});

			this.reportingState = ko.pureComputed(() => {
				// require a data source selection
					if (this.reportSourceKey() == undefined) {
						this.generateReportsEnabled(false);
					return "awaiting_selection";
				}

				// check if the cohort has been generated
					var sourceInfo = this.cohortDefinitionSourceInfo().find(d => d.sourceKey == this.reportSourceKey());
					if (this.getStatusMessage(sourceInfo) != 'COMPLETED') {
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
								reports.push({name: ko.i18n('cohortDefinitions.cohortDefinitionManager.heraclesHeel', 'Heracles Heel'), reportKey: "Heracles Heel", analyses: []});
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

			this.showReportNameDropdown = ko.pureComputed(() => {
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
					title: ko.i18n('options.reports', 'Reports'),
					options: reports,
                    selectedOptions: ko.observableArray([
                        reportPacks.healthcareUtilPersonAndExposureCohort.analyses,
                        reportPacks.healthcareUtilVisitRecordsCohort.analyses,
                    ]),
				},
				periods: {
					title: ko.i18n('options.periods', 'Periods'),
					options: costUtilConst.periods,
					selectedOptions: ko.observableArray([]),
				},
				rollups: {
					title: ko.i18n('options.rollups', 'Rollups'),
                    options: costUtilConst.rollups,
                    selectedOptions: ko.observableArray([]),
				}
			};

			this._selectedCriteria = ko.observable();
			this.selectedCriteria = ko.pureComputed({
				write: criteria => {
					this._selectedCriteria(criteria);
					ko.tasks.runEarly();
				},
				read: () => this._selectedCriteria(),
			})
			this.cohortLinkModalOpened = ko.observable(false);
			this.cohortDefinitionOpened = ko.observable(false);
			this.analysisTypesOpened = ko.observable(false);
			this.currentConceptSet = this.conceptSetStore.current;

			this.trackSub(this.reportSourceKey.subscribe(source => {
				PollService.stop(this.pollId);
				this.reportReportName(null);
				this.reportingSourceStatusAvailable(false);
				this.reportingAvailableReports.removeAll();
				const cd = this.currentCohortDefinition();
				source && this.startPolling(cd, source);
			}));

			this.reportsManagerComponentParams = {
				reportSourceKey: this.reportSourceKey,

			}

			PermissionService.decorateComponent(this, {
				entityTypeGetter: () => entityType.COHORT_DEFINITION,
				entityIdGetter: () => this.currentCohortDefinition().id(),
				createdByUsernameGetter: () => this.currentCohortDefinition() && this.currentCohortDefinition().createdBy()
					&& this.currentCohortDefinition().createdBy().login
			});

			TagsService.decorateComponent(this, {
				assetTypeGetter: () => TagsService.ASSET_TYPE.COHORT_DEFINITION,
				assetGetter: () => this.currentCohortDefinition(),
				addTagToAsset: (tag) => {
					const isDirty = this.dirtyFlag().isDirty();
					this.currentCohortDefinition().tags.push(tag);
					if (!isDirty) {
						this.dirtyFlag().reset();
						this.warningParams.valueHasMutated();
					}
				},
				removeTagFromAsset: (tag) => {
					const tags = this.currentCohortDefinition().tags,
						isDirty = this.dirtyFlag().isDirty();
					tags(tags().filter(t => t.id !== tag.id && tag.groups.filter(tg => tg.id === t.id).length === 0));
					if (!isDirty) {
						this.dirtyFlag().reset();
						this.warningParams.valueHasMutated();
					}
				}
			});

			this.versionsParams = ko.observable({
				versionPreviewUrl: (versionNumber) => `/cohortdefinition/${this.currentCohortDefinition().id()}/version/${versionNumber}`,
				currentVersion: () => {
					return {
						...this.currentCohortDefinition(),
						createdBy: this.currentCohortDefinition().createdBy(),
						createdDate: this.currentCohortDefinition().createdDate(),
						modifiedBy: this.currentCohortDefinition().modifiedBy(),
						modifiedDate: this.currentCohortDefinition().modifiedDate(),
					}
				},
				previewVersion: () => this.previewVersion(),
				getList: () => cohortDefinitionService.getVersions(this.currentCohortDefinition().id()),
				updateVersion: (version) => cohortDefinitionService.updateVersion(version),
				copyVersion: async (version) => {
					this.isCopying(true);
					try {
						const result = await cohortDefinitionService.copyVersion(this.currentCohortDefinition().id(), version.version);
						this.previewVersion(null);
						commonUtils.routeTo(constants.paths.details(result.id));
					} finally {
						this.isCopying(false);
					}
				},
				isAssetDirty: () => this.dirtyFlag().isDirty(),
				canAddComments: () => this.canEdit()
			});

			this.pollForInfoPeriodically();

			this.subscriptions.push(
				this.currentCohortDefinition.subscribe(() => ("export" === this.tabMode()) && this.currentCohortDefinition() && this.refreshPrintFriendly())
			);
		}

		// METHODS

		startPolling(cd, source) {
			this.pollId = PollService.add({
				callback: () => this.queryHeraclesJob(cd, source),
				interval: config.pollInterval,
			});
		}

		async queryHeraclesJob(cd, source) {
			const testName = "HERACLES_COHORT_" + cd.id() + "_" + source;
			try {
				const { data } = await jobService.getByName(testName, "cohortAnalysisJob");
				if (data.jobParameters) {
					this.isGenerated(true);
					this.currentJob({
						...data,
						name: data.jobParameters.jobName,
						startDate: data.startDate ? momentApi.formatDateTimeUTC(data.startDate) : '',
						duration: data.startDate ? momentApi.formatDuration((data.endDate || Date.now()) - data.startDate): ''
					});
				} else {
					this.currentJob(null);
					if (this.isGenerated()) {
						this.reportingSourceStatusAvailable(false);
					}
					this.isGenerated(false);
				}
			} catch (e) {
				console.error(e)
			}
		}

		delete () {
			if (!confirm(ko.i18n('cohortDefinitions.cohortDefinitionManager.confirms.delete', 'Delete cohort definition? Warning: deletion can not be undone!')()))
				return;

			this.isDeleting(true);

			// reset view after save
				cohortDefinitionService.deleteCohortDefinition(this.currentCohortDefinition().id()).
									then( (result) => {
					this.currentCohortDefinition(null);
					PollService.stop(this.pollTimeoutId);
					this.dirtyFlag().reset();
					this.close();
				}, (error) => {
					console.log("Error: " + error);
					if(error.status == 409) {
						alert(ko.i18n('cohortDefinitions.cohortDefinitionManager.confirms.deleteConflict', 'Cohort definition cannot be deleted because it is referenced in some analysis.')());
						this.isDeleting(false);
					} else {
							authApi.handleAccessDenied(error);
					}
				});
		}

		async save () {
			if (this.previewVersion() && !confirm(ko.i18n('common.savePreviewWarning', 'Save as current version?')())) {
				return;
			}

			this.sampleSourceKey(null);
			this.isSaving(true);

			let cohortDefinitionName = this.currentCohortDefinition().name();
			this.currentCohortDefinition().name(cohortDefinitionName.trim());

			// Next check to see that a cohort definition with this name does not already exist
			// in the database. Also pass the id so we can make sure that the
			// current Cohort Definition is excluded in this check.

				try {
					const results = await cohortDefinitionService.exists(this.currentCohortDefinition().name(), this.currentCohortDefinition().id());
					if (results > 0) {
						alert(ko.i18n('cohortDefinitions.cohortDefinitionManager.confirms.saveAlert', 'A cohort definition with this name already exists. Please choose a different name.')());
					} else {
						this.conceptSetStore.clear();

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
						this.previewVersion(null);
						this.versionsParams.valueHasMutated();
						if (redirectWhenComplete) {
							commonUtils.routeTo(constants.paths.details(definition.id()));
						}
					}
					sharedState.CohortDefinition.lastUpdatedId(this.currentCohortDefinition().id());
				} catch (e) {
					alert(ko.i18n('cohortDefinitions.cohortDefinitionManager.confirms.saveError', 'An error occurred while attempting to save a cohort definition.')());
				} finally {
					this.isSaving(false);
				}
			}

			close () {
				if (this.dirtyFlag().isDirty() && !confirm(ko.i18n('cohortDefinitions.cohortDefinitionManager.confirms.close', 'Your cohort changes are not saved. Would you like to continue?')())) {
					return;
				} else {
					this.conceptSetStore.clear();
					this.currentCohortDefinition(null);
					this.previewVersion(null);
					this.dirtyFlag().reset();
					this.reportCohortDefinitionId(null);
					this.reportReportName(null);
					this.reportSourceKey(null);
					commonUtils.routeTo('/cohortdefinitions');
				}
			}

		async copy () {
			this.isCopying(true);
			// reset view after save
			try {
				const result = await cohortDefinitionService.copyCohortDefinition(this.currentCohortDefinition().id());
				commonUtils.routeTo(constants.paths.details(result.id));
			} finally {
				this.isCopying(false);
			}
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

		isCancelDisabled(source) {
			return this.isSourceStopping(source)() || (config.userAuthenticationEnabled ? this.isProcessingByAnother(source) : false);
		}

		isProcessingByAnother(source) {
			return !this.isMine(source) && source.status() !== "COMPLETE" && source.status() !== "FAILED";
		}

		isMine(source) {
			return source.createdBy() ? authApi.subject() === source.createdBy() : false;
		}

		async exportSql({ expression = {} } = {}) {

			return await this.service.getSql(ko.toJS(expression, pruneJSON));
		}

		getSourceKeyInfo (sourceKey) {
			return this.cohortDefinitionSourceInfo().filter((d) => {
				return d.sourceKey == sourceKey
			})[0];
		}

		getSourceId (sourceKey) {
			return sharedState.sources().find(source => source.sourceKey === sourceKey).sourceId;
		}

		generateCohort (source) {
			this.stopping()[source.sourceKey](false);
			this.getSourceKeyInfo(source.sourceKey).status(globalConstants.generationStatuses.PENDING);
			this.getSourceKeyInfo(source.sourceKey).createdBy(authApi.subject());
			if (this.selectedSource() && this.selectedSource().sourceId === source.sourceId) {
				this.toggleCohortReport(null);
			}
			cohortDefinitionService.generate(this.currentCohortDefinition().id(), source.sourceKey)
				.catch(this.authApi.handleAccessDenied)
				.then(({data}) => {
					jobDetailsService.createJob(data);
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

		diagnose() {
			if (this.currentCohortDefinition()) {
				return cohortDefinitionService.runDiagnostics(this.currentCohortDefinition());
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
			var conceptSetItems = conceptSetUitls.toRepositoryConceptSetItems(this.selectedConcepts());
			conceptSetService.saveConceptSet(conceptSet)
				.then((data) => {
					const conceptSetId = data.data.id;
					return conceptSetService.saveConceptSetItems(conceptSetId, conceptSetItems);
				});
		};

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
			let { cohortDefinitionId, conceptSetId, selectedSourceId, mode = 'definition', sourceKey, sampleId, version } = params;
			this.cohortDefinitionIdOnRoute(cohortDefinitionId)
			// cohortDefinitionId can be undefined in case of following links from notifications
			// when another tab of the same cohort definition is selected
			if (!cohortDefinitionId && this.currentCohortDefinition()) {
				cohortDefinitionId = this.currentCohortDefinition().id();
			}
			this.tabMode(mode);
			if(sourceKey) {
				this.sampleSourceKey(sourceKey)
			}
			if(sampleId) {
				this.selectedSampleId(sampleId)
				this.fetchSampleData({sampleId, sourceKey, cohortDefinitionId})
			}
			if (version === 'current') {
				this.previewVersion(null);
				this.prepareCohortDefinition(cohortDefinitionId, conceptSetId, selectedSourceId, sourceKey);
			} else if (version) {
				this.prepareCohortDefinition(cohortDefinitionId, conceptSetId, selectedSourceId, sourceKey, version);
			}
			if (!this.checkifDataLoaded(cohortDefinitionId, conceptSetId, sourceKey)) {
				this.prepareCohortDefinition(cohortDefinitionId, conceptSetId, selectedSourceId, sourceKey);
			} else if (selectedSourceId) {
				let source = this.sharedState.sources().find(s => s.sourceId === selectedSourceId)
				if (source) {
					let selectedSourceInfo = this.cohortDefinitionSourceInfo().find(s => s.sourceKey === source.sourceKey)
					this.expandSelectedSection(selectedSourceInfo);
				}
			} else {
				this.selectedReportSource(null);
			}
		}

		backToCurrentVersion() {
			if (this.dirtyFlag().isDirty() && !confirm(ko.i18n('common.unsavedWarning', 'Unsaved changes will be lost. Proceed?')())) {
				return;
			}
			commonUtils.routeTo(`/cohortdefinition/${this.currentCohortDefinition().id()}/version/current`);
		}

		expandSelectedSection(item) {
			this.selectedReportSource(item);
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
			cdsi.sourceId = source.sourceId;
			if (sourceInfo != null) {
				cdsi.isValid = ko.observable(sourceInfo.isValid);
				cdsi.isCanceled = ko.observable(sourceInfo.isCanceled);
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
				cdsi.failMessage = ko.observable(sourceInfo.failMessage);
				cdsi.createdBy = ko.observable(sourceInfo.createdBy);
			} else {
				cdsi.isValid = ko.observable(false);
				cdsi.isCanceled = ko.observable(false);
				cdsi.status = ko.observable('n/a');
				cdsi.startTime = ko.observable('n/a');
				cdsi.executionDuration = ko.observable('n/a');
				cdsi.personCount = ko.observable('n/a');
				cdsi.recordCount = ko.observable('n/a');
				cdsi.failMessage = ko.observable(null);
				cdsi.createdBy = ko.observable(null);
			}
			return cdsi;
		}

		async loadRequiredData(conceptSetId, selectedSourceId, sourceKey) {
			if (this.currentCohortDefinition()) {
				try {
					// now that we have required information lets compile them into data objects for our view
					const cdmSources = sharedState.sources().filter(commonUtils.hasCDM);
					let results = [];
					let selectedSourceInfo = null;
					for (let s = 0; s < cdmSources.length; s++) {
						const source = cdmSources[s];
						this.sourceAnalysesStatus[source.sourceKey] = ko.observable({
							ready: false,
							checking: false
						});
						const sourceInfo = this.getSourceInfo(source);
						let cdsi = this.getCDSI(source, sourceInfo);
						results.push(cdsi);

						if (selectedSourceId && source.sourceId === selectedSourceId) {
							selectedSourceInfo = cdsi;
						}
					}
					this.cohortDefinitionSourceInfo(results);

					if (selectedSourceInfo) {
						this.expandSelectedSection(selectedSourceInfo);
					}

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
		}

		async prepareCohortDefinition(cohortDefinitionId, conceptSetId, selectedSourceId, sourceKey, versionNumber) {
			this.isLoading(true);
			if(parseInt(cohortDefinitionId) === 0) {
				this.setNewCohortDefinition();
			} else if (versionNumber) {
				const cohortDefinition = await cohortDefinitionService.getVersion(cohortDefinitionId, versionNumber);
				this.currentCohortDefinition(new CohortDefinition(cohortDefinition));
				this.previewVersion(cohortDefinition.versionDef);
				const generationInfo = await cohortDefinitionService.getInfo(cohortDefinitionId);
				this.currentCohortDefinitionInfo(generationInfo);
			} else {
				await this.loadExistingCohortDefinition(cohortDefinitionId);
			}
			await this.loadRequiredData(conceptSetId, selectedSourceId, sourceKey);
			this.isLoading(false);
		}

		setNewCohortDefinition() {
			this.currentCohortDefinition(new CohortDefinition({ id: 0, name: 'New Cohort Definition' }));
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

		checkifDataLoaded(cohortDefinitionId, conceptSetId, sourceKey) {
			if (this.currentCohortDefinition() && this.currentCohortDefinition().id() == cohortDefinitionId) {
				if (this.currentConceptSet() && this.currentConceptSet().id == conceptSetId) {
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
			this.conceptSetStore.current(this.conceptSets()().find(item => item.id == conceptSetId));
			this.conceptSetStore.isEditable(this.canEdit());
			commonUtils.routeTo(`/cohortdefinition/${this.currentCohortDefinition().id()}/conceptsets/`);
		}

		reload () {
			if (this.modifiedJSON.length > 0) {
				var updatedExpression = JSON.parse(this.modifiedJSON);
				this.currentCohortDefinition().expression(new CohortExpression(updatedExpression));
			}
		}

		exportConceptSetsCSV () {
			return FileService.loadZip(`${config.api.url}cohortdefinition/${this.currentCohortDefinition().id()}/export/conceptset`,
					`cohortdefinition-conceptsets-${this.currentCohortDefinition().id()}.zip`);
		}

		toggleCohortReport(item) {
			if (this.selectedReportSource() && this.selectedReportSource().sourceKey === item.sourceKey) {
				this.selectedReportSource(null);
				commonUtils.routeTo('/cohortdefinition/' + this.currentCohortDefinition().id() + '/generation');
			} else {
				this.selectedReportSource(item);
				commonUtils.routeTo('/cohortdefinition/' + this.currentCohortDefinition().id() + '/generation/' + item.sourceId);
			}
		}

		selectTab(key) {
			this.tabMode(key);
			return commonUtils.routeTo('/cohortdefinition/' + this.currentCohortDefinition().id() + '/' + key);
		}

			getStatusMessage (info) {
				if (info.status() === "COMPLETE" && !info.isValid())
					return !info.isCanceled() ? "FAILED" : "CANCELED";
				else
					return info.status() === 'COMPLETE' ? 'COMPLETED' : info.status();
			}

			getStatusMessageTranslated (status) {
				return datatableUtils.getExecutionStatus()(status);
			}

			getStatusTemplate(item) {
				return item.status === 'FAILED' ? 'failed-status-tmpl' : 'success-status-tmpl';
			}

			showExitMessage(sourceKey) {
				const info = this.cohortDefinitionSourceInfo().find(i => i.sourceKey === sourceKey) || { failMessage: ko.i18n('cohortDefinitions.cohortDefinitionManager.failedWithoutAnyMessage', 'Failed without any message')() };
				this.exitMessage(info.failMessage);
				this.isExitMessageShown(true);
			}

			async generateAnalyses ({ descr, duration, analysisIdentifiers, runHeraclesHeel, periods, rollupUtilizationVisit, rollupUtilizationDrug }) {
				if (!confirm(ko.i18nformat('cohortDefinitions.cohortDefinitionManager.confirms.generateAnalyses', 'This will run <%=descr%> and may take about <%=duration%>. Are you sure?', {descr: descr, duration: duration})())) {
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
					descr: ko.i18n('cohortDefinitions.cohortDefinitionManager.generateQuickAnalysis.descr', 'minimal analyses set to provide a quick overview of the cohort')(),
					duration: ko.i18n('cohortDefinitions.cohortDefinitionManager.generateQuickAnalysis.duration', '10 minutes')(),
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
					descr: ko.i18n('cohortDefinitions.cohortDefinitionManager.generateHealthcareAnalyses.descr', 'the Cost and Utilization analyses')(),
					duration: ko.i18n('cohortDefinitions.cohortDefinitionManager.generateHealthcareAnalyses.duration', '10-45 minutes')(),
					analysisIdentifiers: analysisIds,
					runHeraclesHeel: false,
					periods: this.utilReportOptions.periods.selectedOptions(),
					...this.utilReportOptions.rollups.selectedOptions().reduce((acc, current) => { acc[current] = true; return acc }, {}),
				});

			this.showUtilizationToRunModal(false);
		};

			generateAllAnalyses () {
				this.generateAnalyses({
					descr: ko.i18n('cohortDefinitions.cohortDefinitionManager.generateAllAnalyses.descr', 'all analyses')(),
					duration: ko.i18n('cohortDefinitions.cohortDefinitionManager.generateAllAnalyses.duration', '60-90 minutes')(),
					analysisIdentifiers: cohortReportingService.getAnalysisIdentifiers(),
					runHeraclesHeel: true
				});
			};

	// track subscriptions
		trackSub(sub) {
			this.subscriptions.push(sub);
		}

	// dispose subscriptions / cleanup computed observables (non-pureComputeds)
		dispose () {
			super.dispose();
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
			else if (data.hasOwnProperty("VisitDetail"))
				return "visit-detail-criteria-viewer";
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
				    title: ko.i18n('columns.conceptId', 'Concept Id'),
				    data: 'CONCEPT_ID'
				},
				{
				    title: ko.i18n('columns.conceptName', 'Concept Name'),
				    data: 'CONCEPT_NAME'
				},
				{
				    title: ko.i18n('columns.domain', 'Domain'),
				    data: 'DOMAIN_ID'
				},
				{
				    title: ko.i18n('columns.vocabulary', 'Vocabulary'),
				    data: 'VOCABULARY_ID'
				}
			    ];
			    let setsText = '';
			    this.sortedConceptSets().forEach((set) => {
				setsText += '\n' + set.name() + '\n';
				columns.forEach((c) => {
				    setsText += c.title() + '\t';
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

		getAuthorship() {
			const cohortDef = this.currentCohortDefinition();

			let createdText, createdBy, createdDate, modifiedBy, modifiedDate;

			if (this.previewVersion()) {
				createdText = ko.i18n('components.authorship.versionCreated', 'version created');
				createdBy = this.previewVersion().createdBy ? this.previewVersion().createdBy.name : ko.i18n('common.anonymous', 'anonymous');
				createdDate = commonUtils.formatDateForAuthorship(this.previewVersion().createdDate);
				modifiedBy = null;
				modifiedDate = null;
			} else {
				createdText = ko.i18n('components.authorship.created', 'created');
				createdBy = cohortDef.createdBy() ? cohortDef.createdBy().name : ko.i18n('common.anonymous', 'anonymous');
				createdDate = commonUtils.formatDateForAuthorship(cohortDef.createdDate);
				modifiedBy = cohortDef.modifiedBy() ? cohortDef.modifiedBy().name : ko.i18n('common.anonymous', 'anonymous');
				modifiedDate = commonUtils.formatDateForAuthorship(cohortDef.modifiedDate);
			}

			return {
				createdText: createdText,
				createdBy: createdBy,
				createdDate: createdDate,
				modifiedBy: modifiedBy,
				modifiedDate: modifiedDate,
			}
		}

		async refreshPrintFriendly() {
			this.printFriendlyLoading(true);
			try {
				const printFriendlyHtml = await cohortDefinitionService.getCohortPrintFriendly(ko.toJS(this.currentCohortDefinition().expression()));
				this.printFriendlyHtml(printFriendlyHtml.data);
			} catch(error) {
				console.error("Problem loading print-friendly output.", error);
			}finally {
				this.printFriendlyLoading(false);
			}
		}

		// samples methods
		clickSampleTab() {
			this.tabMode('samples');
			const cohortId = this.currentCohortDefinition().id();
			history.pushState(null, '', `#/cohortdefinition/${cohortId}/samples`);
		}
		addNewSample() {
			this.resetSampleForm();
			this.showSampleCreatingModal(true);
		}

		isSampleFormValid() {
			// if a mandotory field is not yet filled at all, it should be error
			return !(this.sampleNameError() || this.patientCountError() || this.firstAgeError() || this.isAgeRangeError());
		}

		resetSampleForm() {
			this.sampleName('')
			this.patientCount('')
			this.sampleAgeType('lessThan')
			this.firstAge(null);
			this.secondAge(null);
			this.isMaleSample(false);
			this.isFeMaleSample(false);
			this.isOtherGenderSample(false);
		}

		async createNewSample() {

			if (!this.isSampleFormValid()) { // do nothing
				return;
			}

			const cohortDefinitionId =this.currentCohortDefinition().id();
			const sourceKey=this.sampleSourceKey()
			const name = this.sampleName();
			const size = Number(this.patientCount());
			const ageMode = this.sampleAgeType();
			let conceptIds = [];
			let otherNonBinary = false;
			const selectAllGender = !this.isMaleSample()&&!this.isFeMaleSample()&&!this.isOtherGenderSample()
			if(this.isMaleSample()||selectAllGender) {
				conceptIds.push(8507);
			}
			if(this.isFeMaleSample()||selectAllGender) {
				conceptIds.push(8532);
			}
			if(this.isOtherGenderSample()||selectAllGender) {
				otherNonBinary = true;
			}

			const firstAge = this.firstAge();
			const secondAge = this.secondAge();
			let age;
			if((this.isAgeRange() && (firstAge==null && secondAge==null)) || (!this.isAgeRange() && firstAge == null)) {
				age = null;
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
				};
			this.newSampleCreatingLoader(true);
			try {
				const res = await sampleService.createSample(payload, {cohortDefinitionId, sourceKey});
				const newData= mapSampleListData([res]);
				this.sampleList.unshift(...newData);
				this.showSampleCreatingModal(false);
			} catch(error) {
				console.error(error);
				alert((error && error.data && error.data.payload && error.data.payload.message) ?
				error.data.payload.message : 'Error when creating sample, please try again later');
			} finally {
				this.newSampleCreatingLoader(false);
			}
		}

		getSampleList(cohortId) {
			this.isLoadingSampleData(true);
			this.selectedSampleId(null);
			const cohortDefinitionId= cohortId || this.currentCohortDefinition().id();
			// if (cohortDefinitionId==0) return
			const sourceKey=this.sampleSourceKey();
			sampleService.getSampleList({cohortDefinitionId, sourceKey})
			.then(res => {
				if(res.generationStatus!="COMPLETE") {
					this.sampleSourceKey(null);
					alert(ko.i18n('cohortDefinitions.cohortDefinitionManager.samples.cohortShouldBeGenerated', 'Cohort should be generated before creating samples')());
					return;
				}
				const sampleListData = mapSampleListData(res.samples);
				this.sampleList(sampleListData);
			})
			.catch(error=>{
				console.error(error);
				alert(ko.i18n('cohortDefinitions.cohortDefinitionManager.samples.errorFetchingList', 'Error when fetching sample list, please try again later')());
			})
			.finally(() => {
				this.isLoadingSampleData(false)
			})
		}

		onSampleListRowClick(d, e) {
			// find index of click
			const {sampleId} = d;
			const rowIndex = this.sampleList().findIndex(el=>el.sampleId == sampleId);

			const cohortDefinitionId= this.currentCohortDefinition().id();
			const sourceKey=this.sampleSourceKey();
			if(e.target.className=='sample-list fa fa-trash') {
				// todo: close existing sample
				if (this.selectedSampleId() == sampleId) {
					this.sampleData([]);
					this.selectedSampleId(null);
					commonUtils.routeTo(`/cohortdefinition/${cohortDefinitionId}/samples/${sourceKey}/`);
				}
				sampleService.deleteSample({cohortDefinitionId, sourceKey, sampleId})
				.then(res=>{
					if(res.ok) {
						this.sampleList.splice(rowIndex, 1);
					}
				})
				.catch(() => {
					alert(ko.i18n('cohortDefinitions.cohortDefinitionManager.samples.errorDeleting', 'Error when deleting sample, please try again later')());
				})
			} else if (e.target.className == 'sample-list fa fa-refresh') {
				this.sampleDataLoading(true);
				this.refreshSample({sampleId, sourceKey, cohortDefinitionId})
				.then(res => {
					this.showSampleDataTable(res.elements);
				})
				.finally(() => {
					this.sampleDataLoading(false);
				});
			} else {
				this.fetchSampleData({sampleId, sourceKey, cohortDefinitionId});
			}
		}

		fetchSampleData({sampleId, sourceKey, cohortDefinitionId}) {
			this.sampleDataLoading(true)
			sampleService.getSample({ cohortDefinitionId, sourceKey, sampleId })
			.then(res=>{
				this.selectedSampleId(sampleId);
				this.selectedSampleName(res.name);
				this.showSampleDataTable(res.elements);
				history.pushState(null, '', `#/cohortdefinition/${cohortDefinitionId}/samples/${sourceKey}/${sampleId}`);
			})
			.catch(error => {
				console.error(error);
				alert(ko.i18n('cohortDefinitions.cohortDefinitionManager.samples.errorFetchingData', 'Error when fetching sample data, please try again later')());
			})
			.finally(() => {
				this.sampleDataLoading(false);
			})
		}

		refreshSample({sampleId, sourceKey, cohortDefinitionId}) {
			return sampleService.refreshSample({cohortDefinitionId, sourceKey, sampleId})
			.catch(() => {
				alert(ko.i18n('cohortDefinitions.cohortDefinitionManager.samples.errorRefreshing', 'Error when refreshing sample, please try again later')());
			})
		}

		onSampleDataClick(d) {
			const sampleId = this.selectedSampleId();
			const cohortDefinitionId= this.currentCohortDefinition().id();
			const sourceKey=this.sampleSourceKey();
			window.open(`#/profiles/${sourceKey}/${d.personId}/${cohortDefinitionId}/${sampleId}`);
		}

		showSampleDataTable(sample) {
			const transformedSampleData = sample.map(el => ({
				personId: el.personId,
				gender: gender(el.genderConceptId),
				ageIndex: el.age
			}));

			this.sampleData(transformedSampleData);
		}
	}

	return commonUtils.build('cohort-definition-manager', CohortDefinitionManager, view);
});
