define([
  'knockout',
  'components/Component',
  'appConfig',
  'utils/CommonUtils',
  'utils/DatatableUtils',
  'utils/ExecutionUtils',
  'services/Poll',
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
  PollService,
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
      resultsPathPrefix,
      downloadApiPaths,
      downloadFileName,
      tableColumns = [],
      executionResultMode,
      runExecutionInParallel,
    }) {
      super();
      this.analysisId = analysisId;
      this.resultsPathPrefix = resultsPathPrefix;
      this.downloadApiPaths = downloadApiPaths;
      this.downloadFileName = downloadFileName;
      this.tableColumns = tableColumns;
      this.runExecutionInParallel = runExecutionInParallel;
      this.pollId = null;

      this.loading = ko.observable(false);
      this.downloading = ko.observableArray();

      this.ExecutionService = ExecutionService;
      this.PermissionService = PermissionService;
      this.extraExecutionPermissions = extraExecutionPermissions;

      this.executionStatuses = consts.executionStatuses;

      this.expandedSection = ko.observable();

      this.isExitMessageShown = ko.observable(false);
      this.exitMessage = ko.observable();

      this.executionResultMode = executionResultMode;
      this.executionGroups = ko.observableArray([]);
      this.executionResultModes = consts.executionResultModes;
      this.isExecutionDesignShown = ko.observable(false);
      this.executionDesign = ko.observable(null);

      this.stopping = ko.observable({});
      this.isSourceStopping = (source) => this.stopping()[source.sourceKey];

      const currentHash = ko.pureComputed(() => design() && design().hashCode);
      const execColumnsMap = {
        Date: {
          title: 'Date',
          className: this.classes('col-exec-date'),
          render: DatatableUtils.getDateFieldFormatter('startTime'),
        },
        Design: {
          title: 'Design',
          className: this.classes('col-exec-checksum'),
          render: DatatableUtils.renderExecutionDesign(this.PermissionService.isPermittedExportGenerationDesign, currentHash),
        },
        Status: {
          title: 'Status',
          data: 'status',
          className: this.classes('col-exec-status'),
          render: DatatableUtils.renderExecutionStatus(),
        },
        Duration: {
          title: 'Duration',
          className: this.classes('col-exec-duration'),
          render: DatatableUtils.renderExecutionDuration(),
        },
        Results: {
          title: 'Results',
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
      this.pollId = PollService.add({
        callback: silently => this.loadData({ silently }),
        interval: 10000,
        isSilentAfterFirstCall: true,
      });
    }

    dispose() {
      PollService.stop(this.pollId);
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
          const { sourceKey, sourceName } = source;
          let group = this.getExecutionGroup(sourceKey);
          if (!group) {
            group = {
              sourceKey,
              sourceName,
              submissions: ko.observableArray(),
              status: ko.observable(),
            };
            this.executionGroups.push(group);
          }

          group.submissions(executionList.filter(({ sourceKey: exSourceKey }) => exSourceKey === sourceKey));
          this.setExecutionGroupStatus(group);
        })
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

    toggleSection(idx) {
      this.expandedSection() === idx ? this.expandedSection(null) : this.expandedSection(idx);
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
        JobDetailsService.createJob(data);
        this.loadData({ silently: true });
      } catch(err) {
        console.error(err);
        this.setExecutionGroupStatus(executionGroup);
      }
    }

    cancelGenerate(sourceKey) {
      this.stopping({...this.stopping(), [sourceKey]: true});
      if (confirm('Do you want to stop generation?')) {
        this.ExecutionService.cancelGeneration(this.analysisId(), sourceKey);
      } else {
        this.stopping({...this.stopping(), [sourceKey]: false});
      }
    }

    setExecutionGroupStatus(executionGroup) {
      executionGroup.status(ExecutionUtils.getExecutionGroupStatus(executionGroup.submissions));
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
      const submission = this.findLatestSubmission(sourceKey);
      if (submission) {
        this.downloadResults(submission.id);
      }
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
          return submissions.sort((a, b) => b.endTime - a.endTime); // sort descending
        }
      }
      return null;
    }

    goToLatestResults(sourceKey) {
      const latestExecutedSubmission = this.findLatestSubmission(sourceKey);
      if (latestExecutedSubmission) {
        this.goToResults(latestExecutedSubmission.id);
        return;
      }
      alert('There is no completed executions for the data source yet');
    }

  }

  return CommonUtils.build('analysis-execution-list', AnalysisExecutionList, view);
});
