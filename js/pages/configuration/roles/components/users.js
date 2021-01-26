define([
    'knockout',
    'atlas-state',
    'text!./users.html',
    'utils/AutoBind',
    'components/Component',
    'utils/CommonUtils',
    'assets/ohdsi.util',
    'services/User',
    'services/role',
    'services/AuthAPI',
    '../../const',
    'databindings'
], function (
    ko,
    sharedState,
    view,
    AutoBind,
    Component,
    commonUtils,
    ohdsiUtils,
    userService,
    roleService,
    authApi,
    constants
) {
    class UserView extends AutoBind(Component) {
        constructor(params) {
            super(params);

            this.isNewRole = params.isNewRole;
            this.roleId = params.roleId;
            this.userItems = params.userItems;
            this.tableOptions = commonUtils.getTableOptions('L');
            this.areUsersSelected = ko.pureComputed(() => { return !!this.userItems().find(user => user.isRoleUser()); });
            this.canEditRoleUsers = ko.pureComputed(() => { return authApi.isAuthenticated() && (this.isNewRole() || authApi.isPermittedEditRoleUsers(this.roleId())); })

        }

        selectAllUsers() {
            this.userItems().forEach(user => user.isRoleUser(true));
        }

        deselectAllUsers() {
            this.userItems().forEach(user => user.isRoleUser(false));
        }

        renderCheckbox(field, editable) {
            return editable
                ? '<span data-bind="click: function(d) { d.' + field + '(!d.' + field + '()); } , css: { selected: ' + field + '}" class="fa fa-check"></span>'
                : '<span data-bind="css: { selected: ' + field + '}" class="fa fa-check readonly"></span>';
        }

    }

    return commonUtils.build('users', UserView, view);

});
