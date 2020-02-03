define([
    'knockout',
    'text!./pathway-exec-wrapper.html',
    'components/Component',
    'utils/CommonUtils',
    '../../PathwayService',
    '../../PermissionService',
    './pathway-results',
    'components/analysisExecution/analysis-execution-list',
], function (
    ko,
    view,
    Component,
    commonUtils,
    PathwayService,
    PermissionService,
) {
    class PathwayExecWrapper extends Component {
        constructor(params) {
            super();

            this.executionId = params.executionId;
            this.componentParams = {
                tableColumns: ['Date', 'Design', 'Status', 'Duration', 'Results'],
                runExecutionInParallel: false,
                resultsPathPrefix: '/pathways/',
                ExecutionService: PathwayService,
                PermissionService,
                ...params,
            };
        }
    }

    return commonUtils.build('pathway-exec-wrapper', PathwayExecWrapper, view);
});
