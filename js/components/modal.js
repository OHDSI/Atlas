define([
    'knockout',
    'providers/Component',
    'utils/CommonUtils',
    'text!./modal.html',
    'less!./modal.less',
], function (
    ko,
    Component,
    commonUtils,
    view
) {
    class AtlasModal extends Component {
        constructor(params) {
            super();

            this.showModal = params.showModal;
            this.title = params.title;
            this.template = params.template;
            this.data = params.data;
        }
    }

    return commonUtils.build('atlas-modal', AtlasModal, view);
});
