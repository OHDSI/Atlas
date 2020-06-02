define([
  "jquery",
  "knockout",
  "text!./cohort-definition-manager.html",
  "appConfig",
  "components/cohortbuilder/CohortDefinition",
  "services/CohortDefinition",
  "services/MomentAPI",
  "services/ConceptSet",
  "services/Permission",
  "components/conceptset/utils",
  "utils/DatatableUtils",
  "components/cohortbuilder/CohortExpression",
  "conceptsetbuilder/InputTypes/ConceptSet",
  "services/CohortReporting",
  "services/VocabularyProvider",
  "utils/ExceptionUtils",
  "atlas-state",
  "clipboard",
  "d3",
  "services/Jobs",
  "services/job/jobDetail",
  "services/JobDetailsService",
  "pages/cohort-definitions/const",
  "pages/Page",
  "utils/AutoBind",
  "utils/Clipboard",
  "utils/CommonUtils",
  "pages/cohort-definitions/const",
  "services/AuthAPI",
  "services/Poll",
  "services/file",
  "services/http",
  "const",
  "./const",
  "components/security/access/const",
  "components/cohortbuilder/components/FeasibilityReportViewer",
  "databindings",
  "faceted-datatable",
  "databindings/expressionCartoonBinding",
  "./components/cohortfeatures/main",
  "./components/checks/conceptset-warnings",
  "conceptset-modal",
  "css!./cohort-definition-manager.css",
  "assets/ohdsi.util",
  "components/cohortbuilder/InclusionRule",
  "components/modal-pick-options",
  "components/heading",
  "components/conceptsetInclusionCount/conceptsetInclusionCount",
  "components/modal",
  "components/modal-exit-message",
  "./components/reporting/cohort-reports/cohort-reports",
  "components/security/access/configure-access-modal",
  "components/authorship",
  "utilities/sql",
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
  { entityType }
) {
  const includeKeys = ["UseEventEnd"];
  function pruneJSON(key, value) {
    if (value === 0 || value || includeKeys.includes(key)) {
      return value;
    } else {
      return;
    }
  }

  function conceptSetSorter(a, b) {
    var textA = a.name().toUpperCase();
    var textB = b.name().toUpperCase();
    return textA < textB ? -1 : textA > textB ? 1 : 0;
  }

  class cohortDefinitions.cohortDefinitionManager extends AutoBind(Clipboard(Page)) {
    constructor(params) {
      super(params);
      this.pollTimeout = null;
      this.authApi = authApi;
      this.config = config;
      this.selectedConcepts = sharedState.selectedConcepts;
      this.loadingIncluded = sharedState.loadingIncluded;
      this.loadingSourcecodes = sharedState.loadingSourcecodes;
      this.relatedSourcecodesOptions =
        globalConstants.relatedSourcecodesOptions;
      this.commonUtils = commonUtils;
      this.includedConcepts = sharedState.includedConcepts;
      this.includedSourcecodes = sharedState.includedSourcecodes;
      this.currentIncludedConceptIdentifierList =
        sharedState.currentIncludedConceptIdentifierList;
      this.isLoading = ko.observable(false);
      this.currentCohortDefinition = sharedState.CohortDefinition.current;
      this.currentCohortDefinitionMode = sharedState.CohortDefinition.mode;
      this.currentCohortDefinitionInfo = sharedState.CohortDefinition.info;
      this.cohortDefinitionSourceInfo = sharedState.CohortDefinition.sourceInfo;
      this.dirtyFlag = sharedState.CohortDefinition.dirtyFlag;
      this.currentConceptSetExpressionJson =
        sharedState.currentConceptSetExpressionJson;
      this.sourceAnalysesStatus = {};
      this.criteriaContext = sharedState.criteriaContext;
      this.reportCohortDefinitionId = ko.observable();
      this.reportSourceKey = ko.observable();
      this.reportReportName = ko.observable();
      this.loadingReport = ko.observable(false);
      this.reportTriggerRun = ko.observable(false);
      this.currentConceptIdentifierList =
        sharedState.currentConceptIdentifierList;
      this.resolvingConceptSetExpression =
        sharedState.resolvingConceptSetExpression;
      this.tabMode = sharedState.CohortDefinition.mode;
      this.warningsTotals = ko.observable(0);
      this.warningCount = ko.observable(0);
      this.infoCount = ko.observable(0);
      this.criticalCount = ko.observable(0);
      this.isExitMessageShown = ko.observable();
      this.exitMessage = ko.observable();
      this.exporting = ko.observable();
      this.service = cohortDefinitionService;
      this.defaultName = ko.unwrap(globalConstants.newEntityNames.cohortDefinition);
      this.isReportGenerating = ko.observable(false);
      this.cdmSources = ko.computed(() => {
        return sharedState
          .sources()
          .filter(
            (source) =>
              commonUtils.hasCDM(source) &&
              authApi.hasSourceAccess(source.sourceKey)
          );
      });
      this.warningClass = ko.computed(() => {
        if (this.warningsTotals() > 0) {
          if (this.criticalCount() > 0) {
            return "warning-alarm";
          } else if (this.warningCount() > 0) {
            return "warning-warn";
          } else {
            return "warning-info";
          }
        }
        return "";
      });

      this.cohortDefinitionCaption = ko.computed(() => {
        if (this.currentCohortDefinition()) {
          if (this.currentCohortDefinition().id() == 0) {
            return this.defaultName;
          } else {
            return (
              ko.unwrap(
                ko.i18nformat('cohortDefinitions.cohortId', 'Cohort #<%=id%>', {id: this.currentCohortDefinition().id()})
              )
            );
          }
        }
      });
      this.isNameFilled = ko.computed(() => {
        return (
          this.currentCohortDefinition() &&
          this.currentCohortDefinition().name()
        );
      });

      this.isNameCorrect = ko.computed(() => {
        return (
          this.isNameFilled() &&
          this.currentCohortDefinition().name() !== ko.unwrap(globalConstants.newEntityNames.cohortDefinition)
        );
      });
      this.isAuthenticated = ko.pureComputed(() => {
        return this.authApi.isAuthenticated();
      });
      this.isNew = ko.pureComputed(() => {
        return (
          !this.currentCohortDefinition() ||
          this.currentCohortDefinition().id() == 0
        );
      });
      this.canEdit = ko.pureComputed(() => {
        if (!authApi.isAuthenticated()) {
          return false;
        }

        if (
          this.currentCohortDefinition() &&
          this.currentCohortDefinition().id() != 0
        ) {
          return (
            authApi.isPermittedUpdateCohort(
              this.currentCohortDefinition().id()
            ) || !config.userAuthenticationEnabled
          );
        } else {
          return (
            authApi.isPermittedCreateCohort() ||
            !config.userAuthenticationEnabled
          );
        }
      });
      this.isSaving = ko.observable(false);
      this.isCopying = ko.observable(false);
      this.isDeleting = ko.observable(false);
      this.isProcessing = ko.computed(() => {
        return this.isSaving() || this.isCopying() || this.isDeleting();
      });
      this.canCopy = ko.pureComputed(() => {
        return (
          !this.dirtyFlag().isDirty() &&
          !this.isNew() &&
          ((this.isAuthenticated() &&
            this.authApi.isPermittedCopyCohort(
              this.currentCohortDefinition().id()
            )) ||
            !config.userAuthenticationEnabled)
        );
      });
      this.canDelete = ko.pureComputed(() => {
        if (this.isNew()) {
          return false;
        }
        return (
          (this.isAuthenticated() &&
            this.authApi.isPermittedDeleteCohort(
              this.currentCohortDefinition().id()
            )) ||
          !config.userAuthenticationEnabled
        );
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

        return this.authApi.isPermittedReadCohort(
          this.currentCohortDefinition().id()
        );
      });

      this.hasAccessToGenerate = (sourceKey) => {
        if (this.isNew()) {
          return false;
        }

        return this.authApi.isPermittedGenerateCohort(
          this.currentCohortDefinition().id(),
          sourceKey
        );
      };
      this.hasAccessToReadCohortReport = (sourceKey) => {
        return (
          this.isAuthenticated() &&
          this.authApi.isPermittedReadCohortReport(
            this.currentCohortDefinition().id(),
            sourceKey
          )
        );
      };
      if (!this.hasAccess()) return;

      this.renderCountColumn = datatableUtils.renderCountColumn;

      this.exportSqlService = this.exportSql;

      this.cohortConst = cohortConst;
      this.generationTabMode = ko.observable("inclusion");
      this.inclusionTabMode = ko.observable("person");
      this.exportTabMode = ko.observable("printfriendly");
      this.importTabMode = ko.observable(
        cohortConst.importTabModes.identifiers
      );
      this.importConceptSetJson = ko.observable();
      this.conceptSetTabMode = sharedState.currentConceptSetMode;
      this.onConceptSetTabMode = this.conceptSetTabMode.subscribe(
        conceptSetService.onCurrentConceptSetModeChanged
      );
      this.showImportConceptSetModal = ko.observable(false);
      this.sharedState = sharedState;
      this.identifiers = ko.observable();
      this.sourcecodes = ko.observable();
      this.conceptLoading = ko.observable(false);
      this.conceptSetName = ko.observable();
      this.tabPath = ko.computed(() => {
        var path = this.tabMode();
        if (path === "export") {
          path += "/" + this.exportTabMode();
        }
        if (this.exportTabMode() === "cartoon") {
          setTimeout(() => {
            this.delayedCartoonUpdate("ready");
          }, 10);
        }
        return path;
      });
      this.canSave = ko.pureComputed(() => {
        return (
          this.dirtyFlag().isDirty() &&
          !this.isRunning() &&
          this.canEdit() &&
          this.isNameCorrect()
        );
      });

      this.disableConceptSetExport = ko.pureComputed(() => {
        return (
          this.dirtyFlag().isDirty() ||
          (this.currentCohortDefinition() &&
            this.currentCohortDefinition().expression() &&
            this.currentCohortDefinition().expression().ConceptSets().length ===
              0)
        );
      });

      this.disableConceptSetExportMessage = ko.pureComputed(() => {
        if (
          this.currentCohortDefinition() &&
          this.currentCohortDefinition().expression().ConceptSets().length === 0
        ) {
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
        var isNew =
          this.currentCohortDefinition() &&
          this.currentCohortDefinition() &&
          this.currentCohortDefinition().id() == 0;
        const hasInitialEvent =
          this.currentCohortDefinition() &&
          this.currentCohortDefinition()
            .expression()
            .PrimaryCriteria()
            .CriteriaList().length > 0;
        var canGenerate = !(isDirty || isNew) && hasInitialEvent;
        return canGenerate;
      });

      this.modifiedJSON = "";
      Object.defineProperty(this, "expressionJSON", {
        get: () => this.getExpressionJson(),
        set: (val) => this.setExpressionJson(val),
      });

      this.selectedSource = ko.observable();
      this.selectedReportSource = ko.observable();

      this.sortedConceptSets = ko.computed((d) => {
        if (this.currentCohortDefinition() != null) {
          var clone = this.currentCohortDefinition()
            .expression()
            .ConceptSets()
            .slice(0);
          return clone.sort(conceptSetSorter);
        }
      });

      // model behaviors
      this.onConceptSetTabRespositoryConceptSetSelected = (conceptSet) => {
        this.showImportConceptSetModal(false);
        this.loadConceptSet(conceptSet.id);
      };

      this.includedConceptsColumns = [
        {
          title: '<i class="fa fa-shopping-cart"></i>',
          render: (s, p, d) => {
            var css = "";
            var icon = "fa-shopping-cart";
            if (sharedState.selectedConceptsIndex[d.CONCEPT_ID] == 1) {
              css = " selected";
            }
            return '<i class="fa ' + icon + " " + css + '"></i>';
          },
          orderable: false,
          searchable: false,
        },
        {
          title: ko.i18n('columns.id', 'Id'),
          data: "CONCEPT_ID",
        },
        {
          title: ko.i18n('columns.code', 'Code'),
          data: "CONCEPT_CODE",
        },
        {
          title: ko.i18n('columns.name', 'Name'),
          data: "CONCEPT_NAME",
          render: commonUtils.renderLink,
        },
        {
          title: ko.i18n('columns.class', 'Class'),
          data: "CONCEPT_CLASS_ID",
        },
        {
          title: ko.i18n('columns.standardConceptCaption', 'Standard Concept Caption'),
          data: "STANDARD_CONCEPT_CAPTION",
          visible: false,
        },
        {
          title: "RC",
          data: "RECORD_COUNT",
          className: "numeric",
        },
        {
          title: "DRC",
          data: "DESCENDANT_RECORD_COUNT",
          className: "numeric",
        },
        {
          title: ko.i18n('columns.domain', 'Domain'),
          data: "DOMAIN_ID",
        },
        {
          title: ko.i18n('columns.vocabulary', 'Vocabulary'),
          data: "VOCABULARY_ID",
        },
        {
          title: ko.i18n('columns.ancestors', 'Ancestors'),
          data: "ANCESTORS",
          render: conceptSetService.getAncestorsRenderFunction(),
        },
      ];
      this.relatedSourcecodesColumns = globalConstants.getRelatedSourcecodesColumns(
        sharedState,
        { canEditCurrentConceptSet: this.canEdit }
      );
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
            caption: ko.i18n('options.vocabulary', 'Vocabulary'),
            binding: (o) => {
              return o.VOCABULARY_ID;
            },
          },
          {
            caption: ko.i18n('options.class', 'Class'),
            binding: (o) => {
              return o.CONCEPT_CLASS_ID;
            },
          },
          {
            caption: ko.i18n('options.domains', 'Domain'),
            binding: (o) => {
              return o.DOMAIN_ID;
            },
          },
          {
            caption: ko.i18n('options.standardConcept', 'Standard Concept'),
            binding: (o) => {
              return o.STANDARD_CONCEPT_CAPTION;
            },
          },
          {
            caption: ko.i18n('options.invalidReason', 'Invalid Reason'),
            binding: (o) => {
              return o.INVALID_REASON_CAPTION;
            },
          },
          {
            caption: ko.i18n('options.hasRecords', 'Has Records'),
            binding: (o) => {
              return parseInt(o.RECORD_COUNT) > 0;
            },
          },
          {
            caption: ko.i18n('options.hasDescendantRecords', 'Has Descendant Records'),
            binding: (o) => {
              return parseInt(o.DESCENDANT_RECORD_COUNT) > 0;
            },
          },
        ],
      };
      this.stopping = ko.pureComputed(() =>
        this.cohortDefinitionSourceInfo().reduce(
          (acc, target) => ({
            ...acc,
            [target.sourceKey]: ko.observable(false),
          }),
          {}
        )
      );
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
                var sourceId = sharedState
                  .sources()
                  .find((source) => source.sourceKey == cdsi.sourceKey)
                  .sourceId;
                return sourceId === info.id.sourceId;
              })[0];

              if (source) {
                // only bother updating those sources that we know are running
                if (this.isSourceRunning(source)) {
                  source.status(info.status);
                  source.includeFeatures(info.includeFeatures);
                  source.isValid(info.isValid);
                  source.startTime(
                    momentApi.formatDateTime(new Date(info.startTime))
                  );
                  source.executionDuration("...");
                  source.personCount("...");
                  source.recordCount("...");

                  if (info.status != "COMPLETE" && info.status != "FAILED") {
                    hasPending = true;
                    if (
                      this.selectedReportSource() &&
                      source.sourceId === this.selectedReportSource().sourceId
                    ) {
                      this.selectedReportSource(null);
                    }
                  } else {
                    var commaFormatted = d3.format(",");
                    source.executionDuration(
                      momentApi.formatDuration(info.executionDuration)
                    );
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
      };

      this.isRunning = ko.pureComputed(() => {
        return (
          this.cohortDefinitionSourceInfo().filter((info) => {
            return !(info.status() == "COMPLETE" || info.status() == "n/a");
          }).length > 0
        );
      });

      this.canCreateConceptSet = ko.computed(() => {
        return (
          (this.authApi.isAuthenticated() &&
            this.authApi.isPermittedCreateConceptset()) ||
          !config.userAuthenticationEnabled
        );
      });

      this.cohortDefinitionLink = ko.computed(() => {
        if (this.currentCohortDefinition()) {
          return commonUtils.normalizeUrl(
            this.config.api.url,
            "cohortdefinition",
            this.currentCohortDefinition().id()
          );
        }
      });

      // reporting sub-system
      this.generateButtonCaption = ko.observable("Generate Reports");
      this.generateReportsEnabled = ko.observable(false);
      this.createReportJobFailed = ko.observable(false);
      this.createReportJobError = ko.observable();
      this.reportingError = ko.observable();
      this.currentJob = ko.observable();
      this.reportingSourceStatusAvailable = ko.observable(false);
      this.reportingSourceStatusLoading = ko.observable(false);
      this.reportOptionCaption = ko.pureComputed(() => {
        return this.reportingSourceStatusLoading()
          ? ko.i18n('common.loading', 'Loading Reports...')
          : ko.i18n('cohortDefinitions.cohortDefinitionManager.selectReport', 'Select a Report');
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
        var sourceInfo = this.cohortDefinitionSourceInfo().find(
          (d) => d.sourceKey == this.reportSourceKey()
        );
        if (this.getStatusMessage(sourceInfo) != "COMPLETE") {
          this.generateReportsEnabled(false);
          return "cohort_not_generated";
        }

        // check which reports have required data
        if (
          !this.reportingSourceStatusAvailable() &&
          !this.reportingSourceStatusLoading()
        ) {
          this.reportingSourceStatusLoading(true);
          cohortReportingService
            .getCompletedAnalyses(
              sourceInfo,
              this.currentCohortDefinition().id()
            )
            .done((results) => {
              var reports = cohortReportingService.getAvailableReports(results);
              if (reports.length == 0) {
                this.reportingAvailableReports(reports);
                this.generateReportsEnabled(false);
                this.reportingSourceStatusAvailable(true);
                this.reportingSourceStatusLoading(false);
                return "checking_status";
              }
              cohortReportingService
                .getCompletedHeraclesHeelAnalyses(
                  sourceInfo,
                  this.currentCohortDefinition().id()
                )
                .done((heelResults) => {
                  if (heelResults.length > 0) {
                    reports.push({
                      name: ko.i18n('cohortDefinitions.cohortDefinitionManager.heraclesHeel', 'Heracles Heel'),
                      reportKey: "Heracles Heel",
                      analyses: [],
                    });
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
          if (
            this.currentJob().status &&
            (this.currentJob().status == "STARTED" ||
              this.currentJob().status == "STARTING" ||
              this.currentJob().status == "RUNNING")
          ) {
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
        errorPackage.sourceAnalysesStatus = this.sourceAnalysesStatus[
          this.reportSourceKey()
        ]();
        errorPackage.report = this.reportReportName();
        this.reportingError(JSON.stringify(errorPackage));
        // reset button to allow regeneration
        this.generateReportsEnabled(false);
        return "unknown_cohort_report_state";
      });

      this.showReportNameDropdown = ko.computed(() => {
        return (
          this.reportSourceKey() != undefined &&
          this.reportingState() != "checking_status" &&
          this.reportingState() != "cohort_not_generated" &&
          this.reportingState() != "reports_not_generated" &&
          this.reportingState() != "generating_reports"
        );
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
      ].map((item) => ({
        label: item.name,
        value: item.analyses,
      }));

      this.utilReportOptions = {
        reports: {
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
        },
      };

      this.selectedCriteria = ko.observable();
      this.cohortLinkModalOpened = ko.observable(false);
      this.cohortDefinitionOpened = ko.observable(false);
      this.analysisTypesOpened = ko.observable(false);

      this.currentConceptSet = sharedState.ConceptSet.current;
      this.currentConceptSetDirtyFlag = sharedState.ConceptSet.dirtyFlag;
      this.currentConceptSetSource = sharedState.ConceptSet.source;

      this.reportSourceKeySub = this.reportSourceKey.subscribe((source) => {
        PollService.stop(this.pollId);
        this.reportReportName(null);
        this.reportingSourceStatusAvailable(false);
        this.reportingAvailableReports.removeAll();
        const cd = this.currentCohortDefinition();
        source && this.startPolling(cd, source);
      });
      this.reportsManagerComponentParams = {
        reportSourceKey: this.reportSourceKey,
      };
      PermissionService.decorateComponent(this, {
        entityTypeGetter: () => entityType.COHORT_DEFINITION,
        entityIdGetter: () => this.currentCohortDefinition().id(),
        createdByUsernameGetter: () =>
          this.currentCohortDefinition() &&
          this.currentCohortDefinition().createdBy(),
      });
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
        const { data } = await jobService.getByName(
          testName,
          "cohortAnalysisJob"
        );
        data.jobParameters
          ? this.currentJob({ ...data, name: data.jobParameters.jobName })
          : this.currentJob(null);
      } catch (e) {
        console.error(e);
      }
    }

    delete() {
      if (
        !confirm(
          ko.unwrap(ko.i18n('cohortDefinitions.cohortDefinitionManager.confirms.delete', 'Delete cohort definition? Warning: deletion can not be undone!'))
        )
      )
        return;

      this.isDeleting(true);
      clearTimeout(this.pollTimeout);

      // reset view after save
      cohortDefinitionService
        .deleteCohortDefinition(this.currentCohortDefinition().id())
        .then(
          (result) => {
            this.currentCohortDefinition(null);
            document.location = "#/cohortdefinitions";
          },
          (error) => {
            console.log("Error: " + error);
            if (error.status == 409) {
              alert(
                ko.unwrap(ko.i18n('cohortDefinitions.cohortDefinitionManager.confirms.save', 'Cohort definition cannot be deleted because it is referenced in some analysis.'))
              );
              this.isDeleting(false);
            } else {
              authApi.handleAccessDenied(error);
            }
          }
        );
    }

    async save() {
      this.isSaving(true);
      clearTimeout(this.pollTimeout);

      // Next check to see that a cohort definition with this name does not already exist
      // in the database. Also pass the id so we can make sure that the
      // current Cohort Definition is excluded in this check.

      try {
        const results = await cohortDefinitionService.exists(
          this.currentCohortDefinition().name(),
          this.currentCohortDefinition().id()
        );
        if (results > 0) {
          alert(
            ko.unwrap(ko.i18n('cohortDefinitions.cohortDefinitionManager.confirms.saveAlert', 'A cohort definition with this name already exists. Please choose a different name.'))
          );
        } else {
          this.clearConceptSet();

          // If we are saving a new cohort definition (id === 0) then clear
          // the id field before saving
          if (this.currentCohortDefinition().id() === "0") {
            this.currentCohortDefinition().id(undefined);
          }
          var definition = ko.toJS(this.currentCohortDefinition());

          // reset view after save
          const savedDefinition = await cohortDefinitionService.saveCohortDefinition(
            definition
          );
          definition = new CohortDefinition(savedDefinition);
          const redirectWhenComplete =
            definition.id() != this.currentCohortDefinition().id();
          this.currentCohortDefinition(definition);
          if (redirectWhenComplete) {
            commonUtils.routeTo(constants.paths.details(definition.id()));
          }
        }
        sharedState.CohortDefinition.lastUpdatedId(
          this.currentCohortDefinition().id()
        );
      } catch (e) {
        alert(
          ko.unwrap(ko.i18n('cohortDefinitions.cohortDefinitionManager.confirms.save', 'An error occurred while attempting to save a cohort definition.'))
        );
      } finally {
        this.isSaving(false);
      }
    }

    close() {
      if (
        this.dirtyFlag().isDirty() &&
        !confirm(
          ko.unwrap(ko.i18n('cohortDefinitions.cohortDefinitionManager.confirms.close', 'Your cohort changes are not saved. Would you like to continue?'))
        )
      ) {
        return;
      } else {
        commonUtils.routeTo("/cohortdefinitions");
        this.currentConceptSet(null);
        this.currentConceptSetDirtyFlag().reset();
        this.currentCohortDefinition(null);
        this.dirtyFlag().reset();
        this.reportCohortDefinitionId(null);
        this.reportReportName(null);
        this.reportSourceKey(null);
      }
    }

    async copy() {
      this.isCopying(true);
      clearTimeout(this.pollTimeout);
      // reset view after save
      try {
        const result = await cohortDefinitionService.copyCohortDefinition(
          this.currentCohortDefinition().id()
        );
        document.location = "#/cohortdefinition/" + result.id;
      } finally {
        this.isCopying(false);
      }
    }

    isSourceRunning(source) {
      if (source) {
        switch (source.status()) {
          case "COMPLETE":
            return false;
            break;
          case "n/a":
            return false;
            break;
          default:
            return true;
        }
      } else {
        return false;
      }
    }

    async exportSql({ expression = {} } = {}) {
      return await this.service.getSql(ko.toJS(expression, pruneJSON));
    }

    getSourceKeyInfo(sourceKey) {
      return this.cohortDefinitionSourceInfo().filter((d) => {
        return d.sourceKey == sourceKey;
      })[0];
    }

    getSourceId(sourceKey) {
      return sharedState
        .sources()
        .find((source) => source.sourceKey === sourceKey).sourceId;
    }

    generateCohort(source, includeFeatures) {
      this.stopping()[source.sourceKey](false);
      this.getSourceKeyInfo(source.sourceKey).status("PENDING");
      if (
        this.selectedSource() &&
        this.selectedSource().sourceId === source.sourceId
      ) {
        this.toggleCohortReport(null);
      }
      cohortDefinitionService
        .generate(
          this.currentCohortDefinition().id(),
          source.sourceKey,
          includeFeatures
        )
        .catch(this.authApi.handleAccessDenied)
        .then(({ data }) => {
          jobDetailsService.createJob(data);
          setTimeout(() => {
            if (!this.pollTimeout) {
              this.pollForInfo();
            }
          }, 3000);
        });
    }

    cancelGenerate(source) {
      this.stopping()[source.sourceKey](true);
      cohortDefinitionService.cancelGenerate(
        this.currentCohortDefinition().id(),
        source.sourceKey
      );
    }

    hasCDM(source) {
      for (var d = 0; d < source.daimons.length; d++) {
        if (source.daimons[d].daimonType == "CDM") {
          return true;
        }
      }
      return false;
    }

    hasResults(source) {
      for (var d = 0; d < source.daimons.length; d++) {
        if (source.daimons[d].daimonType == "Results") {
          return true;
        }
      }
      return false;
    }

    closeConceptSet() {
      conceptSetService.clearConceptSet();
    }

    deleteConceptSet() {
      this.currentCohortDefinition()
        .expression()
        .ConceptSets.remove((item) => {
          return item.id == this.currentConceptSet().id;
        });
      this.closeConceptSet();
    }

    removeConceptSet(id) {
      this.currentCohortDefinition()
        .expression()
        .ConceptSets.remove(function (item) {
          return item.id === id;
        });
    }

    removeInclusionRule(name) {
      this.currentCohortDefinition()
        .expression()
        .InclusionRules.remove((item) => item.name() === name);
    }

    fixConceptSet(warning) {
      if (warning.type === "ConceptSetWarning" && warning.conceptSetId >= 0) {
        this.removeConceptSet(warning.conceptSetId);
      } else if (warning.type === "IncompleteRuleWarning" && warning.ruleName) {
        this.removeInclusionRule(warning.ruleName);
      }
    }

    showSaveConceptSet() {
      this.newConceptSetName(this.currentConceptSet().name());
      this.saveConceptSetShow(true);
    }

    saveConceptSet() {
      this.saveConceptSetShow(false);
      var conceptSet = {
        id: 0,
        name: this.newConceptSetName(),
      };
      var conceptSetItems = conceptSetUitls.toConceptSetItems(
        this.selectedConcepts()
      );
      var conceptSetId;
      var itemsPromise = (data) => {
        conceptSetId = data.data.id;
        return conceptSetService.saveConceptSetItems(
          conceptSetId,
          conceptSetItems
        );
      };
      conceptSetService.saveConceptSet(conceptSet).then(itemsPromise);
    }

    createConceptSet() {
      var newConceptSet = new ConceptSet();
      var cohortConceptSets = this.currentCohortDefinition().expression()
        .ConceptSets;
      newConceptSet.id =
        cohortConceptSets().length > 0
          ? Math.max(...cohortConceptSets().map((c) => c.id)) + 1
          : 0;
      return newConceptSet;
    }

    prepareConceptSet(conceptSet) {
      var cohortConceptSets = this.currentCohortDefinition().expression()
        .ConceptSets;
      cohortConceptSets.push(conceptSet);
      this.loadConceptSet(conceptSet.id);
      this.currentCohortDefinitionMode("conceptsets");
    }

    newConceptSet() {
      this.prepareConceptSet(this.createConceptSet());
    }

    importConceptSet() {
      this.prepareConceptSet(this.createConceptSet());
      this.conceptSetTabMode(this.cohortConst.conceptSetTabModes.import);
    }

    importFromRepository() {
      this.showImportConceptSetModal(true);
    }

			async onConceptSetRepositoryImport (newConceptSet) {
				this.showImportConceptSetModal(false);

				const conceptSet = this.findConceptSet();
				if (conceptSet.expression.items().length == 0 ||
					confirm("Your concept set expression will be replaced with new one. Would you like to continue?")) {
					conceptSet.name(newConceptSet.name);
					conceptSet.expression.items().forEach((item)=> {
						sharedState.selectedConceptsIndex[item.concept.CONCEPT_ID] = 0;
						sharedState.selectedConcepts.remove((v)=> {
							return v.concept.CONCEPT_ID === item.concept.CONCEPT_ID;
						});
					});
					conceptSet.expression.items().length = 0;

					const expression = await vocabularyApi.getConceptSetExpression(newConceptSet.id);
					this.importConceptSetExpressionItems(expression.items);
				}
			};

    clearImportConceptSetJson() {
      this.importConceptSetJson("");
    }

    findConceptSet() {
      return this.currentCohortDefinition()
        .expression()
        .ConceptSets()
        .find((item) => {
          return item.id === this.currentConceptSet().id;
        });
    }

    importConceptSetExpression() {
      var items = JSON.parse(this.importConceptSetJson()).items;
      this.importConceptSetExpressionItems(items);
    }

    importConceptSetExpressionItems(items) {
      var conceptSet = this.findConceptSet();
      if (!conceptSet) {
        return;
      }

      var conceptSetItemsToAdd = sharedState.selectedConcepts();
      items.forEach((item) => {
        var conceptSetItem = {};
        conceptSetItem.concept = item.concept;
        conceptSetItem.isExcluded = ko.observable(item.isExcluded);
        conceptSetItem.includeDescendants = ko.observable(
          item.includeDescendants
        );
        conceptSetItem.includeMapped = ko.observable(item.includeMapped);

        sharedState.selectedConceptsIndex[item.concept.CONCEPT_ID] = 1;
        conceptSetItemsToAdd.push(conceptSetItem);
      });
      sharedState.selectedConcepts(conceptSetItemsToAdd);
      this.loadConceptSet(conceptSet.id);
      this.clearImportConceptSetJson();
    }

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
      if (
        this.currentCohortDefinition() &&
        this.currentConceptSetSource() === "cohort"
      ) {
        var conceptSet = this.currentCohortDefinition()
          .expression()
          .ConceptSets()
          .find((item) => {
            return item.id === this.currentConceptSet().id;
          });
        if (conceptSet) {
          conceptSet.expression.items.valueHasMutated();
        }
      }
      this.conceptSetTabMode("details");
    }

    importConceptIdentifiers() {
      this.conceptLoading(true);
      vocabularyApi
        .getConceptsById(this.identifiers().match(/[0-9]+/g))
        .then(this.appendConcepts, () => {
          this.conceptLoading(false);
        })
        .then(() => {
          this.conceptLoading(false);
        })
        .then(() => {
          this.identifiers("");
        });
    }

    importSourceCodes() {
      this.conceptLoading(true);
      vocabularyApi
        .getConceptsByCode(this.sourcecodes().match(/[0-9a-zA-Z\.-]+/g))
        .then(this.appendConcepts, () => {
          this.conceptLoading(false);
        })
        .then(() => {
          this.conceptLoading(false);
        })
        .then(() => {
          this.sourcecodes("");
        });
    }

    viewReport(sourceKey, reportName) {
      // TODO: Should we prevent running an analysis on an unsaved cohort definition?
      if (this.currentCohortDefinition().id() > 0) {
        this.reportCohortDefinitionId(this.currentCohortDefinition().id());
        this.reportReportName(reportName);
        this.reportSourceKey(sourceKey);
        this.reportTriggerRun(true);
      }
    }

    onRouterParamsChanged(params) {
      const {
        cohortDefinitionId,
        conceptSetId,
        mode = "definition",
        sourceKey,
      } = params;
      this.clearConceptSet();
      this.tabMode(mode);
      if (
        !this.checkifDataLoaded(cohortDefinitionId, conceptSetId, sourceKey)
      ) {
        this.prepareCohortDefinition(
          cohortDefinitionId,
          conceptSetId,
          sourceKey
        );
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
        cdsi.executionDuration = ko.observable(
          momentApi.formatDuration(sourceInfo.executionDuration)
        );
        const commaFormatted = d3.format(",");
        if (sourceInfo.personCount == null) {
          cdsi.personCount = ko.observable("...");
        } else {
          cdsi.personCount = ko.observable(
            commaFormatted(sourceInfo.personCount)
          );
        }
        if (sourceInfo.recordCount) {
          cdsi.recordCount = ko.observable(
            commaFormatted(sourceInfo.recordCount)
          );
        } else {
          cdsi.recordCount = ko.observable("...");
        }
        cdsi.includeFeatures = ko.observable(sourceInfo.includeFeatures);
        cdsi.failMessage = ko.observable(sourceInfo.failMessage);
      } else {
        cdsi.isValid = ko.observable(false);
        cdsi.isCanceled = ko.observable(false);
        cdsi.status = ko.observable("n/a");
        cdsi.startTime = ko.observable("n/a");
        cdsi.executionDuration = ko.observable("n/a");
        cdsi.personCount = ko.observable("n/a");
        cdsi.recordCount = ko.observable("n/a");
        cdsi.includeFeatures = ko.observable(false);
        cdsi.failMessage = ko.observable(null);
      }
      return cdsi;
    }

			async loadRequiredData(conceptSetId, sourceKey) {
				if (this.currentCohortDefinition()) {
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
			}

    async prepareCohortDefinition(cohortDefinitionId, conceptSetId, sourceKey) {
      this.isLoading(true);
      if (parseInt(cohortDefinitionId) === 0) {
        this.setNewCohortDefinition();
      } else {
        await this.loadExistingCohortDefinition(cohortDefinitionId);
      }
      await this.loadRequiredData(conceptSetId, sourceKey);
      this.isLoading(false);
    }

    setNewCohortDefinition() {
      this.currentCohortDefinition(
        new CohortDefinition({ id: "0", name: ko.unwrap(globalConstants.newEntityNames.cohortDefinition) })
      );
      this.currentCohortDefinitionInfo([]);
    }

    async loadExistingCohortDefinition(id) {
      try {
        const cohortDefinition = await cohortDefinitionService.getCohortDefinition(
          id
        );
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
      if (
        this.currentCohortDefinition() &&
        this.currentCohortDefinition().id() == cohortDefinitionId
      ) {
        if (
          this.currentConceptSet() &&
          this.currentConceptSet().id == conceptSetId &&
          this.currentConceptSetSource() == "cohort"
        ) {
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
      this.currentConceptSetSource("cohort");
      this.conceptSetTabMode("details");
      const conceptSet = this.currentCohortDefinition()
        .expression()
        .ConceptSets()
        .find((item) => item.id == conceptSetId);
      let conceptPromise;
      if (
        conceptSet.expression.items() &&
        conceptSet.expression.items().length > 0 &&
        !conceptSet.expression.items()[0].concept.STANDARD_CONCEPT
      ) {
        var identifiers = Array.from(conceptSet.expression.items()).map(() => {
          return this.concept.CONCEPT_ID;
        });
        conceptPromise = conceptSetService
          .lookupIdentifiers(identifiers)
          .then(({ data }) => {
            for (var i = 0; i < data.length; i++) {
              conceptSet.expression.items()[i].concept = data[i];
            }
            conceptSet.expression.items.valueHasMutated();
          });
      } else {
        conceptPromise = Promise.resolve();
      }
      conceptPromise.then(() => {
        // Reconstruct the expression items
        for (var i = 0; i < conceptSet.expression.items().length; i++) {
          sharedState.selectedConceptsIndex[
            conceptSet.expression.items()[i].concept.CONCEPT_ID
          ] = 1;
        }
        sharedState.selectedConcepts(conceptSet.expression.items());
        this.currentConceptSet({
          name: conceptSet.name,
          id: conceptSet.id,
        });
        conceptSetService.resolveConceptSetExpression();
      });
    }

    reload() {
      if (this.modifiedJSON.length > 0) {
        var updatedExpression = JSON.parse(this.modifiedJSON);
        this.currentCohortDefinition().expression(
          new CohortExpression(updatedExpression)
        );
      }
    }

    async exportConceptSetsCSV() {
      this.exporting(true);
      try {
        await FileService.loadZip(
          `${
            config.api.url
          }cohortdefinition/${this.currentCohortDefinition().id()}/export/conceptset`,
          `cohortdefinition-conceptsets-${this.currentCohortDefinition().id()}.zip`
        );
      } catch (e) {
        alert(exceptionUtils.translateException(e));
      } finally {
        this.exporting(false);
      }
    }

    toggleCohortReport(item) {
      if (
        this.selectedReportSource() &&
        this.selectedReportSource().sourceKey === item.sourceKey
      ) {
        this.selectedReportSource(null);
      } else {
        this.selectedReportSource(item);
      }
    }

    getStatusMessage(info) {
      if (info.status() === "COMPLETE" && !info.isValid())
        return !info.isCanceled() ? "FAILED" : "CANCELED";
      else return info.status();
    }

    getStatusTemplate(item) {
      return item.status === "FAILED"
        ? "failed-status-tmpl"
        : "success-status-tmpl";
    }

    showExitMessage(sourceKey) {
      const info = this.cohortDefinitionSourceInfo().find(
        (i) => i.sourceKey === sourceKey
      ) || { failMessage: ko.unwrap(ko.i18n('cohortDefinitions.cohortDefinitionManager.failedWithoutAnyMessage', 'Failed without any message')) };
      this.exitMessage(info.failMessage);
      this.isExitMessageShown(true);
    }

    calculateProgress(j) {
      return j.progress() + "%";
    }

    async generateAnalyses({
      descr,
      duration,
      analysisIdentifiers,
      runHeraclesHeel,
      periods,
      rollupUtilizationVisit,
      rollupUtilizationDrug,
    }) {
      if (
        !confirm(
          ko.unwrap(ko.i18nformat('cohortDefinitions.cohortDefinitionManager.confirms.generateAnalyses', 'This will run <%=descr%> and may take about <%=duration%>. Are you sure?', {descr: descr, duration: duration}))
        )
      ) {
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
        const { data } = await cohortDefinitionService.getCohortAnalyses(
          cohortJob
        );
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
        this.generateButtonCaption("Generate");
      }
      await this.queryHeraclesJob(
        this.currentCohortDefinition(),
        this.reportSourceKey()
      );
      this.isReportGenerating(false);
    }

    generateQuickAnalysis() {
      this.generateAnalyses({
        descr: ko.i18n('cohortDefinitions.cohortDefinitionManager.generateQuickAnalysis.descr', 'minimal analyses set to provide a quick overview of the cohort'),
        duration: ko.i18n('cohortDefinitions.cohortDefinitionManager.generateQuickAnalysis.duration', '10 minutes'),
        analysisIdentifiers: cohortReportingService.getQuickAnalysisIdentifiers(),
        runHeraclesHeel: false,
      });
    }

    selectHealthcareAnalyses() {
      this.showUtilizationToRunModal(true);
    }

    generateHealthcareAnalyses() {
      const analysisIds = this.utilReportOptions.reports
        .selectedOptions()
        .reduce((acc, ids) => [...acc, ...ids], []);
      this.generateAnalyses({
        descr: ko.i18n('cohortDefinitions.cohortDefinitionManager.generateHealthcareAnalyses.descr', 'the Cost and Utilization analyses'),
        duration: ko.i18n('cohortDefinitions.cohortDefinitionManager.generateHealthcareAnalyses.duration', '10-45 minutes'),
        analysisIdentifiers: analysisIds,
        runHeraclesHeel: false,
        periods: this.utilReportOptions.periods.selectedOptions(),
        ...this.utilReportOptions.rollups
          .selectedOptions()
          .reduce((acc, current) => {
            acc[current] = true;
            return acc;
          }, {}),
      });

      this.showUtilizationToRunModal(false);
    }

    generateAllAnalyses() {
      this.generateAnalyses({
        descr: ko.i18n('cohortDefinitions.cohortDefinitionManager.generateAllAnalyses.descr', 'all analyses'),
        duration: ko.i18n('cohortDefinitions.cohortDefinitionManager.generateAllAnalyses.duration', '60-90 minutes'),
        analysisIdentifiers: cohortReportingService.getAnalysisIdentifiers(),
        runHeraclesHeel: true,
      });
    }

    // dispose subscriptions / cleanup computed observables (non-pureComputeds)
    dispose() {
      this.onConceptSetTabMode && this.onConceptSetTabMode.dispose();
      this.cohortDefinitionLink.dispose();
      this.cohortDefinitionCaption.dispose();
      this.tabPath.dispose();
      this.sortedConceptSets.dispose();
      this.reportingState.dispose();
      this.showReportNameDropdown.dispose();
      this.reportSourceKeySub.dispose();
      sharedState.includedHash(null);
      this.ancestorsModalIsShown(false);
      PollService.stop(this.pollId);
    }

    getCriteriaIndexComponent(data) {
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
      else if (data.hasOwnProperty("Death")) return "death-criteria-viewer";
      else if (data.hasOwnProperty("LocationRegion"))
        return "location-region-viewer";
      else return "unknownCriteriaType";
    }

    copyExpressionToClipboard() {
      this.copyToClipboard(
        "#btnCopyExpressionClipboard",
        "#copyExpressionToClipboardMessage"
      );
    }

    copyIdentifierListToClipboard() {
      this.copyToClipboard(
        "#btnCopyIdentifierListClipboard",
        "#copyIdentifierListMessage"
      );
    }

    copyIncludedConceptIdentifierListToClipboard() {
      this.copyToClipboard(
        "#btnCopyIncludedConceptIdentifierListClipboard",
        "#copyIncludedConceptIdentifierListMessage"
      );
    }

    copyTextViewToClipboard() {
      let columns = [
        {
          title: ko.i18n('columns.conceptId', 'Concept Id'),
          data: "CONCEPT_ID",
        },
        {
          title: ko.i18n('columns.conceptName', 'Concept Name'),
          data: "CONCEPT_NAME",
        },
        {
          title: ko.i18n('columns.domain', 'Domain'),
          data: "DOMAIN_ID",
        },
        {
          title: ko.i18n('columns.vocabulary', 'Vocabulary'),
          data: "VOCABULARY_ID",
        },
      ];
      let setsText = "";
      this.sortedConceptSets().forEach((set) => {
        setsText += "\n" + set.name() + "\n";
        columns.forEach((c) => {
          setsText += c.title + "\t";
        });
        setsText += "Excluded\tDescendants\tMapped" + "\n";
        set.expression.items().forEach((item) => {
          columns.forEach((c) => {
            setsText += item.concept[c.data] + "\t";
          });
          setsText += (item.isExcluded() ? "YES" : "NO") + "\t";
          setsText += (item.includeDescendants() ? "YES" : "NO") + "\t";
          setsText += (item.includeMapped() ? "YES" : "NO") + "\n";
        });
      });
      this.copyToClipboard(
        "#btnCopyTextViewClipboard",
        "#copyTextViewMessage",
        setsText
      );
    }

    copyCohortExpressionJSONToClipboard() {
      this.copyToClipboard(
        "#btnCopyExpressionJSONClipboard",
        "#copyCohortExpressionJSONMessage"
      );
    }

    getExpressionJson() {
      if (!this.currentCohortDefinition()) {
        return ko.toJSON(null);
      }
      return ko.toJSON(
        this.currentCohortDefinition().expression(),
        (key, value) => {
          // UseEventEnd is a speical case: always include this key in the result.
          if (value === 0 || value || ["UseEventEnd"].indexOf(key) > -1) {
            return value;
          } else {
            return;
          }
        },
        2
      );
    }

    setExpressionJson(value) {
      this.modifiedJSON = value;
    }

    getDataboundColumn(field, title, width) {
      return {
        data: field,
        title: title,
        width: width,
        render: function (data, type, row) {
          return type == "display"
            ? `<span data-bind='text: ${field}'></span>`
            : ko.utils.unwrapObservable(data);
        },
      };
    }

    getAuthorship() {
      const cohortDef = this.currentCohortDefinition();
      return {
        createdBy: this.currentCohortDefinition().createdBy(),
        createdDate: this.currentCohortDefinition().createdDate(),
        modifiedBy: this.currentCohortDefinition().modifiedBy(),
        modifiedDate: this.currentCohortDefinition().modifiedDate(),
      };
    }
  }

  return commonUtils.build(
    "cohort-definition-manager",
    cohortDefinitions.cohortDefinitionManager,
    view
  );
});
