define([
    'knockout',
    'text!./characterization-exec-wrapper.html',
    'components/Component',
    'utils/CommonUtils',
    'const',
    'pages/characterizations/services/CharacterizationService',
	'pages/characterizations/services/PermissionService',
    './characterization-results',
    'components/analysisExecution/analysis-execution-list',
], function (
    ko,
    view,
    Component,
    commonUtils,
    consts,
    CharacterizationService,
    PermissionService,
) {
    class CharacterizationExecWrapper extends Component {
        constructor(params) {
            super();

            this.executionId = params.executionId;
            const extraExecutionPermissions = ko.computed(() =>!params.designDirtyFlag().isDirty() && params.design().cohorts().length);
            this.componentParams = {
                tableColumns: ['Date', 'Design', 'Status', 'Duration', 'Results'],
                runExecutionInParallel: false,
                resultsPathPrefix: '/cc/characterizations/',
                analysisId: params.characterizationId,
                ExecutionService: CharacterizationService,
                PermissionService,
                extraExecutionPermissions,
                executionResultMode: consts.executionResultModes.VIEW,
                ...params,
            };
        }
    }

    return commonUtils.build('characterization-exec-wrapper', CharacterizationExecWrapper, view);
});
