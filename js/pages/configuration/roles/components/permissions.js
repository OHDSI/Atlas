define([
    'knockout',
    'atlas-state',
    'text!./permissions.html',
    'components/Component',
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
    Component,
    AutoBind,
    Component,
    commonUtils,
    ohdsiUtils,
    userService,
    roleService,
    authApi,
    constants
) {
    class PermissionsView extends AutoBind(Component) {
        constructor(params) {
            super(params);

            this.isNewRole = params.isNewRole;
            this.roleId = params.roleId;
            this.permissionItems = params.permissionItems;

            this.canEditRolePermissions = ko.pureComputed(() => { return authApi.isAuthenticated() && (this.isNewRole() || authApi.isPermittedEditRolePermissions(this.roleId())); });
        }

        renderCheckbox(field, editable) {
            return editable
                ? '<span data-bind="click: function(d) { d.' + field + '(!d.' + field + '()); } , css: { selected: ' + field + '}" class="fa fa-check"></span>'
                : '<span data-bind="css: { selected: ' + field + '}" class="fa fa-check readonly"></span>';
        }
    }

    return commonUtils.build('permissions', PermissionsView, view);
});
