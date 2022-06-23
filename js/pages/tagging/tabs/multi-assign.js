define([
    'knockout',
    'text!./multi-assign.html',
    'utils/AutoBind',
    'components/Component',
    'utils/CommonUtils',
    'less!./multi-assign.less',
], function (
    ko,
    view,
    AutoBind,
    Component,
    commonUtils
) {
    class TagsMultiAssign extends AutoBind(Component) {
        constructor(params) {
            super();
            this.params = params;
            this.actionType = ko.observable('assign');
            this.showTagsComponent = ko.observable(false);
        }
    }

    return commonUtils.build('multi-assign', TagsMultiAssign, view);
});
