define([
    'knockout',
    'text!./pathway-exec-wrapper.html',
    'components/Component',
    'utils/CommonUtils',
    'services/JobPollService',
    'const',
    '../../PathwayService',
    '../../PermissionService',
    './pathway-results',
    'components/analysisExecution/analysis-execution-list',
], function (
    ko,
    view,
    Component,
    commonUtils,
    JobPollService,
    consts,
    PathwayService,
    PermissionService,
) {
    class PathwayExecWrapper extends Component {
        constructor(params) {
            super();

            this.executionId = params.executionId;
            this.criticalCount = params.criticalCount;
            this.dirtyFlag = params.dirtyFlag;

            const extraExecutionPermissions = ko.computed(() => !this.dirtyFlag().isDirty() 
                && params.isEditPermitted()
                && this.criticalCount() <= 0);       
                
            const generationDisableReason = ko.computed(() => {
                if (this.dirtyFlag().isDirty()) return ko.unwrap(consts.disabledReasons.DIRTY);
                if (this.criticalCount() > 0) return ko.unwrap(consts.disabledReasons.INVALID_DESIGN);
                return ko.unwrap(consts.disabledReasons.ACCESS_DENIED);
            });
            this.componentParams = {
                tableColumns: ['Date', 'Design', 'Status', 'Duration', 'Results'],
                runExecutionInParallel: false,
                resultsPathPrefix: '/pathways/',
                ExecutionService: PathwayService,
                PermissionService,
                PollService: JobPollService,
                extraExecutionPermissions,
                generationDisableReason,
                executionResultMode: consts.executionResultModes.VIEW,
                selectedSourceId: params.selectedSourceId,
                ...params,
            };
        }
    }

    return commonUtils.build('pathway-exec-wrapper', PathwayExecWrapper, view);
});
