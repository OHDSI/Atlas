define([
    'knockout',
    'text!./pathway-exec-wrapper.html',
    'components/Component',
    'utils/CommonUtils',
    './pathway-executions',
    './pathway-results',
], function (
    ko,
    view,
    Component,
    commonUtils
) {
    class PathwayExecWrapper extends Component {
        constructor(params) {
            super();

            this.executionId = params.executionId;
            this.componentParams = params;
        }
    }

    return commonUtils.build('pathway-exec-wrapper', PathwayExecWrapper, view);
});
