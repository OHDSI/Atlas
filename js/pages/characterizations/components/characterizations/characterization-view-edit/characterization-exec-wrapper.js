define([
    'knockout',
    'text!./characterization-exec-wrapper.html',
    'components/Component',
    'utils/CommonUtils',
    'services/JobPollService',
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
    JobPollService,
    consts,
    CharacterizationService,
    PermissionService,
) {
    class CharacterizationExecWrapper extends Component {
        constructor(params) {
            super();

            this.executionId = params.executionId;
            this.criticalCount = params.criticalCount;
            this.design = params.design;
            this.designDirtyFlag = params.designDirtyFlag;

            const extraExecutionPermissions = ko.computed(() => !this.designDirtyFlag().isDirty() 
                && this.design() && this.design().cohorts().length 
                && params.isEditPermitted()
                && this.criticalCount() <= 0);       
                
            const generationDisableReason = ko.computed(() => {
                if (this.designDirtyFlag().isDirty()) return ko.unwrap(consts.disabledReasons.DIRTY);
                if (this.criticalCount() > 0) return ko.unwrap(consts.disabledReasons.INVALID_DESIGN);
                if (this.design() && !this.design().cohorts().length) return ko.unwrap(consts.disabledReasons.EMPTY_COHORTS);
                return ko.unwrap(consts.disabledReasons.ACCESS_DENIED);
            });            
            this.componentParams = {
                tableColumns: ['Date', 'Design', 'Status', 'Duration', 'Results'],
                runExecutionInParallel: false,
                resultsPathPrefix: '/cc/characterizations/',
                analysisId: params.characterizationId,
                ExecutionService: CharacterizationService,
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

    return commonUtils.build('characterization-exec-wrapper', CharacterizationExecWrapper, view);
});
