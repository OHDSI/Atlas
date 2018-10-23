define([
    'knockout',
    'text!./characterization-exec-wrapper.html',
    'components/Component',
    'utils/CommonUtils',
    './characterization-executions',
    './characterization-results',
], function (
    ko,
    view,
    Component,
    commonUtils
) {
    class CharacterizationExecWrapper extends Component {
        constructor(params) {
            super();

            this.executionId = params.executionId;
            this.componentParams = params;
        }
    }

    return commonUtils.build('characterization-exec-wrapper', CharacterizationExecWrapper, view);
});
