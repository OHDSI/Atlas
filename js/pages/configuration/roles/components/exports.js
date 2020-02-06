define([
    'knockout',
    'atlas-state',
    'text!./exports.html',
    'components/Component',
    'utils/AutoBind',
    'components/Component',
    'utils/Clipboard',
    'pages/configuration/roles/roleJsonParser',
    'utils/CommonUtils'
], function (
    ko,
    sharedState,
    view,
    Component,
    AutoBind,
    Component,
    Clipboard,
    roleJsonParser,
    commonUtils
) {

    const clipboardButtonId = '#btnCopyExpressionJSONClipboard',
          clipboardButtonMessageId = '#copyRoleExpressionJSONMessage';

    class ExportView extends AutoBind(Clipboard(Component)) {
        constructor(params) {
            super(params);

            this.roleName = params.roleName;
            this.userItems = params.userItems;
            this.permissionList = params.permissions;
            this.permissionItems = params.permissionItems;
            this.roles = params.roles;

            this.dirtyFlag = params.dirtyFlag;
            this.modifiedJSON = ko.observable();
            this.validetedRoles = [];
            this.users = sharedState.users;

            this.isJSONValid = ko.observable(false);
            this.validationErrors = ko.observable();
            this.warnings = ko.observable({});

            Object.defineProperty(this, 'expressionJSON', {
                get: () => this.getExpressionJson(),
                set: (val) => this.setExpressionJson(val),
            });

            this.modifiedJSON(this.getJsonFromRoles());
        }

        reload () {
            if (this.modifiedJSON().length > 0 && this.isJSONValid()) {
                const object = JSON.parse(this.modifiedJSON());
                const role = Array.isArray(object) ? object[0] : object;

                this.roleName(role.role);
                this.userItems().forEach(userItem => {
                    const isUserPartOfTheRole = role.users.some(user => user.id === userItem.login);
                    userItem.isRoleUser(isUserPartOfTheRole);
                });
                this.permissionItems().forEach(permissionItem => {
                    const isPermissionPartOfTheRole = role.permissions.some(permission => permission.id === permissionItem.permission())
                    permissionItem.isRolePermission(isPermissionPartOfTheRole);
                });

            }
        }

        copyRoleExpressionJSONToClipboard() {
            this.copyToClipboard(clipboardButtonId, clipboardButtonMessageId);
        }

        getUsersList() {
            return this.userItems()
                .filter(user => user.isRoleUser());
        }

        getPermissionsList() {
            return this.permissionItems()
                .filter(permission => permission.isRolePermission());
        }

        fixJSON(type = 'jsonIssues') {
            let json = this.modifiedJSON();
            const newJson = roleJsonParser.fixRoles(json, this.validetedRoles, type);

            this.setExpressionJson(newJson);
        }

        getExpressionJson() {
            return this.modifiedJSON();
        }

        setExpressionJson(json) {
            this.modifiedJSON(json);

            const usersMap = {};
            this.users().forEach(user => {
                usersMap[user.login] = user;
            });

            const permissionsMap = {};
            this.permissionList().forEach(p => {
                permissionsMap[p.permission] = p;
            });

            let existedRolesWithoutCurrent = this.roles
                .filter(role => role.id !== this.currentRole.id);

            let parseJsonResult = roleJsonParser.validateAndParseRoles(json, usersMap, permissionsMap, existedRolesWithoutCurrent);
            this.isJSONValid(parseJsonResult.isValid);
            this.validationErrors(parseJsonResult.error);
            this.validetedRoles = parseJsonResult.roles;
            this.setWarnings(parseJsonResult.roles);
        }
        setWarnings(roles) {
            const jsonIssues = roles
                .some(role => role.permissions.unavailable.length || role.users.unavailable.length);
            const permissionSpecificIdsIssues = roles
                .some(role => role.rolePermissions.some(p => roleJsonParser.PERMISSION_ID_REGEX.test(p.id)));
            this.warnings({ jsonIssues, permissionSpecificIdsIssues });
        }

        getJsonFromRoles() {
            const role = [{
                role: this.roleName(),
                permissions: this.getPermissionsList().map(p => ({ id: p.permission() })),
                users: this.getUsersList().map(u => ({ id: u.login })),
            }];

            return JSON.stringify(role, null, 2);
        }

    }

    return commonUtils.build('exports', ExportView, view);
});
