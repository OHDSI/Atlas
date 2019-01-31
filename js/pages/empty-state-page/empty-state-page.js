define([
    'knockout',
    'text!./empty-state-page.html',
    'components/Component',
    'services/EventBus',
    'utils/CommonUtils',
    'pages/Page',
    'components/empty-state',
], function (
    ko,
    view,
    Component,
    EventBus,
    commonUtils,
    Page,
) {
    class EmptyState extends Page {

        constructor(params) {
            super(params);
            this.message = EventBus.errorMsg() || 'An entity cannot be found';
            EventBus.clearMessage();
            return this;
        }
    }

    return commonUtils.build('empty-state-page', EmptyState, view);
});
