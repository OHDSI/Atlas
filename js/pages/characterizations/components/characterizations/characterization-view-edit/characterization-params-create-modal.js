define([
    'knockout',
    'atlas-state',
    'text!./characterization-params-create-modal.html',
    'appConfig',
    'services/AuthAPI',
    'components/Component',
    'utils/CommonUtils',
    'utils/DatatableUtils',
    'pages/characterizations/const',
    'less!./characterization-params-create-modal.less',
], function (
    ko,
    sharedState,
    view,
    config,
    authApi,
    Component,
    commonUtils
) {
    class CharacterizationParamsCreateModal extends Component {
        constructor(params) {
            super();

            this.showModal = params.showModal;
            this.parentSubmit = params.submit;

            this.paramName = ko.observable();
            this.paramValue = ko.observable();

            this.submitParam = this.submitParam.bind(this);
        }

        submitParam() {
            this.parentSubmit({
                name: this.paramName(),
                value: this.paramValue()
            });
            this.resetParams();
        }

        resetParams() {
            this.paramName('')
            this.paramValue('')
        }
    }

    return commonUtils.build('characterization-params-create-modal', CharacterizationParamsCreateModal, view);
});
