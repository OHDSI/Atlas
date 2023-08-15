define([
  'knockout',
  'components/Component',
  'appConfig',
  'utils/CommonUtils',
  'utils/DatatableUtils',
  'utils/ExecutionUtils',
  'services/Source',
  'services/JobDetailsService',
  'services/file',
  'lodash',
  'const',
  'text!./analysis-execution-list.html',
  'less!./analysis-execution-list.less',
  'components/modal-exit-message',
], function (
  ko,
  Component,
  config,
  CommonUtils,
  DatatableUtils,
  ExecutionUtils,
  SourceService,
  JobDetailsService,
  FileService,
  lodash,
  consts,
	view
) {
  class AnalysisExecutionList extends Component {
    constructor({
      analysisId,
      design,
      ExecutionService,
      PermissionService,
      extraExecutionPermissions,
      generationDisableReason,
      resultsPathPrefix,
      downloadApiPaths,
      downloadFileName,
      tableColumns = [],
      executionResultMode,
      runExecutionInParallel,
      PollService,
      selectedSourceId,
      tableOptions,
    }) {
      super();
      this.analysisId = analysisId;
      this.analysisId.subscribe((id) => {
        if (id) {
          this.loadData();
        }
      });
      this.resultsPathPrefix = resultsPathPrefix;
      this.downloadApiPaths = downloadApiPaths;
      this.downloadFileName = downloadFileName;
      this.tableColumns = tableColumns;
      this.runExecutionInParallel = runExecutionInParallel;
      this.pollId = null;
      this.PollService = PollService;
      this.selectedSourceId = selectedSourceId;
      this.tableOptions = tableOptions || CommonUtils.getTableOptions('S');
      this.loading = ko.observable(false);
      this.downloading = ko.observableArray();

      this.ExecutionService = ExecutionService;
      this.PermissionService = PermissionService;
      this.extraExecutionPermissions = extraExecutionPermissions;
      this.generationDisableReason = generationDisableReason;

      this.executionStatuses = consts.executionStatuses;
      this.runningExecutionStatuses = [
        this.executionStatuses.RUNNING,
        this.executionStatuses.STARTED,
      ];

      this.isExitMessageShown = ko.observable(false);
      this.exitMessage = ko.observable();

      this.executionResultMode = executionResultMode;
      this.executionGroups = ko.observableArray([]);
      this.showOnlySourcesWithResults = ko.observable(false);
      this.filteredExecutionGroups = ko.pureComputed(() => {
        return this.showOnlySourcesWithResults()
            ? this.executionGroups().filter(eg => eg.submissions().length > 0)
            : this.executionGroups();
      });
      this.executionResultModes = consts.executionResultModes;
      this.isExecutionDesignShown = ko.observable(false);
      this.executionDesign = ko.observable(null);

      this.sourcesColumn = [{
          render: (s, p, d) => {
            return `<span>${d.sourceName}</span><span data-bind="template: {
                        name: 'execution-group',
                        data: {
                            ...$data,
                            classes: $parent.classes,
                            execColumns: $parent.execColumns,
                            isExpanded: $parent.selectedSourceId() == $data.sourceId,
                            toggleSection: () => $parent.toggleSection($data.sourceId)
                        }    
                    }"></span>`;
          }
      }];

      this.stopping = ko.observable({});
      this.isSourceStopping = (source) => this.stopping()[source.sourceKey];

      const currentHash = ko.pureComputed(() => design() && design().hashCode);
      const execColumnsMap = {
        Date: {
          title: ko.i18n('columns.date', 'Date'),
          className: this.classes('col-exec-date'),
          render: DatatableUtils.getDateFieldFormatter('startTime'),
        },
        Design: {
          title: ko.i18n('columns.design', 'Design'),
          className: this.classes('col-exec-checksum'),
          render: DatatableUtils.renderExecutionDesign(this.PermissionService.isPermittedExportGenerationDesign, currentHash),
        },
        Status: {
          title: ko.i18n('columns.status', 'Status'),
          data: 'status',
          className: this.classes('col-exec-status'),
          render: DatatableUtils.renderExecutionStatus(),
        },
        Duration: {
          title: ko.i18n('columns.duration', 'Duration'),
          className: this.classes('col-exec-duration'),
          render: DatatableUtils.renderExecutionDuration(),
        },
        Results: {
          title: ko.i18n('columns.results', 'Results'),
          data: 'results',
          className: this.classes('col-exec-results'),
          render: this.executionResultMode === this.executionResultModes.VIEW
            ? DatatableUtils.renderExecutionResultsView()
            : DatatableUtils.renderExexcutionResultsDownload(this.isResultsViewPermitted.bind(this)),
        }
      };
      this.execColumns = tableColumns.map(col => execColumnsMap[col]);

      this.isViewGenerationsPermitted =  ko.computed(
        () => (this.analysisId() ? this.PermissionService.isPermittedListGenerations(this.analysisId()) : true)
      );

      this.isViewGenerationsPermitted && this.startPolling();
    }

    startPolling() {
      this.pollId = this.PollService.add({
        callback: silently => this.loadData({ silently }),
        interval: config.pollInterval,
        isSilentAfterFirstCall: true,
      });
    }

    dispose() {
      this.PollService.stop(this.pollId);
    }


    async loadData({ silently = false } = {}) {
      !silently && this.loading(true);

      const analysisId = this.analysisId();

      try {
        const allSources = await SourceService.loadSourceList();
        const executionList = await this.ExecutionService.listExecutions(analysisId);
        let sourceList = allSources.filter(({ daimons = [] }) => {
          const daimonTypes = daimons.map(({ daimonType }) => daimonType);
          return ['CDM', 'Results'].every(daimonType => daimonTypes.includes(daimonType));
        });
        sourceList = lodash.sortBy(sourceList, ['sourceName']);
        sourceList.forEach(source => {
          const { sourceKey, sourceName, sourceId } = source;
          let group = this.getExecutionGroup(sourceKey);
          if (!group) {
            group = {
              sourceId,
              sourceKey,
              sourceName,
              submissions: ko.observableArray(),
              status: ko.observable(),
            };
            this.executionGroups.push(group);
          }

          group.submissions(executionList.filter(({ sourceKey: exSourceKey }) => exSourceKey === sourceKey));
          this.setExecutionGroupStatus(group);
        });
        this.executionGroups.valueHasMutated();
      } catch (err) {
        console.error(err);
      } finally {
        this.loading(false);
      }
    }

    async showExecutionDesign(executionId) {
      try {
        this.executionDesign(null);
        this.isExecutionDesignShown(true);
        const data = await this.ExecutionService.loadExportDesignByGeneration(executionId);
        this.executionDesign(data);
      } catch (err) {
        console.error(err);
        this.executionDesign(null);
        this.isExecutionDesignShown(false);
        alert('Failed to load execution design');
      }
    }

    getExecutionGroup(sourceKey) {
      return this.executionGroups().find(({ sourceKey: groupSourceKey }) => groupSourceKey === sourceKey)
    }

    showExitMessage(sourceKey, id) {
      const group = this.getExecutionGroup(sourceKey) || { submissions: ko.observableArray() };
      const submission = group.submissions().find(({ id: submissionId }) => submissionId === id);
      if (submission && submission.exitMessage) {
        this.exitMessage(submission.exitMessage);
        this.isExitMessageShown(true);
      }
    }

    toggleSection(sourceId) {
      if (parseInt(this.selectedSourceId()) === sourceId) {
        this.selectedSourceId(null);
        CommonUtils.routeTo(`${this.resultsPathPrefix}${this.analysisId()}/executions`);
      } else {
        this.selectedSourceId(sourceId);
        CommonUtils.routeTo(`${this.resultsPathPrefix}${this.analysisId()}/executions/${sourceId}`);
      }
    }

    isGenerationPermitted(sourceKey) {
      const isPermitted = this.PermissionService.isPermittedGenerate(this.analysisId(), sourceKey);
      if (this.extraExecutionPermissions) {
        return isPermitted && this.extraExecutionPermissions();
      }
      return isPermitted;
    }

    isResultsViewPermitted(sourceKey) {
      return this.PermissionService.isPermittedResults(sourceKey);
    }

    getDisableReason(sourceKey) {
      if (this.isGenerationPermitted(sourceKey)) return null;
      if (this.generationDisableReason) {
        return this.generationDisableReason();
      }
    }

    async generate(sourceKey) {
      this.stopping({ ...this.stopping(), [sourceKey]: false });
      const executionGroup = this.getExecutionGroup(sourceKey);
      if (!executionGroup) return false;
      try {
        if (this.runExecutionInParallel) {
          await ExecutionUtils.StartExecution(executionGroup);
        }
        executionGroup.status(this.executionStatuses.PENDING);
        const data = await this.ExecutionService.generate(this.analysisId(), sourceKey);
        if (data) {
          JobDetailsService.createJob(data);
          this.loadData({silently: true});
        }
      } catch(err) {
        console.error(err);
        this.setExecutionGroupStatus(executionGroup);
      }
    }

    cancelGenerate(sourceKey) {
      this.stopping({...this.stopping(), [sourceKey]: true});
      if (confirm(ko.i18n('components.analysisExecution.stopGenerationConfirmation', 'Do you want to stop generation?')())) {
        this.ExecutionService.cancelGeneration(this.analysisId(), sourceKey);
      } else {
        this.stopping({...this.stopping(), [sourceKey]: false});
      }
    }

    setExecutionGroupStatus(executionGroup) {
      executionGroup.status(ExecutionUtils.getExecutionGroupStatus(executionGroup.submissions));
    }

    checkResults({ sourceKey, callback }) {
      const submission = this.findLatestSubmission(sourceKey);
      if (submission) {
        callback(submission.id);
      } else {
        alert(ko.i18n('components.analysisExecution.noCompletedExecutionsForDataSource', 'There is no completed executions for the data source yet')());
      }
    }

    async downloadResults(generationId) {
      this.downloading.push(generationId);
      try {
        await FileService.loadZip(config.webAPIRoot + this.downloadApiPaths.downloadResults(generationId), `${this.downloadFileName}-${generationId}.zip`);
      } finally {
        this.downloading.remove(generationId);
      }
    }

    downloadLatestResults(sourceKey) {
      this.checkResults({
        sourceKey,
        callback: id => this.downloadResults(id),
      });
    }

    isDownloadInProgress(id) {
      return ko.computed(() => this.downloading.indexOf(id) > -1);
    }

    goToResults(executionId) {
      CommonUtils.routeTo(`${this.resultsPathPrefix}${this.analysisId()}/results/${executionId}`);
    }

    findLatestSubmission(sourceKey) {
      const executionGroup = this.getExecutionGroup(sourceKey);
      if (executionGroup) {
        const submissions = [...executionGroup.submissions()];
        if (submissions.length > 0) {
          submissions.sort((a, b) => b.endTime - a.endTime); // sort descending
          return submissions.find(s => s.status === this.executionStatuses.COMPLETED);
        }
      }
      return null;
    }

    goToLatestResults(sourceKey) {
      this.checkResults({
        sourceKey,
        callback: id => this.goToResults(id),
      });
    }

  }

  return CommonUtils.build('analysis-execution-list', AnalysisExecutionList, view);
});
