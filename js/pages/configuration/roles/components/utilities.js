define([
    'knockout',
    'atlas-state',
    'text!./utilities.html',
    'components/Component',
    'utils/AutoBind',
    'components/Component',
    'pages/configuration/roles/roleJsonParser',
    'utils/CommonUtils',
    'utilities/import',
    'utilities/export'
], function (
    ko,
    sharedState,
    view,
    Component,
    AutoBind,
    Component,
    roleJsonParser,
    commonUtils
) {

    class UtilitieView extends AutoBind(Component) {
        constructor(params) {
            super(params);
            const self = this;

            this.initFromParams(params);

            this.validetedRoles = [];
            this.users = sharedState.users;

            this.isJSONValid = ko.observable(false);
            this.validationWarnings = ko.observable();
            this.fixableValidationWarnings = ko.observable();
            this.validationErrors = ko.observable();
            this.fixableValidationErrors = ko.observable();

            this.expressionMode = ko.observable('import');
            this.importJSON = ko.observable();

            this.importJSON.subscribe(function (jsonString) {
                self.validateJson(jsonString)
            });
            this.exportService = this.exportJson;
            this.importService = this.importJson;
        }

        initFromParams(params) {
            this.dirtyFlag = params.dirtyFlag;

            this.roleName = params.roleName;
            this.userItems = params.userItems;
            this.permissionList = params.permissions;
            this.permissionItems = params.permissionItems;
            this.existingRoles = params.roles;
            this.currentRoleId = params.roleId;
            this.save = params.save;

            this.canReadRole = params.canReadRole;
            this.canReadRoles = params.canReadRoles;
            this.canEditRole = params.canEditRole;
            this.canEditRoleUsers = params.canEditRoleUsers;
            this.canEditRolePermissions = params.canEditRolePermissions;
        }

        async afterImportSuccess(jsonString) {
            this.setImportJsonToTheVariables(jsonString);
            this.save();
        };

        isPermittedImport() {
            return this.canEditRoleUsers() && this.canEditRolePermissions();
        }

        isPermittedExport(id) {
            return this.canReadRole();
        }

        getUsersList() {
            return this.userItems()
                .filter(user => user.isRoleUser());
        }

        getPermissionsList() {
            return this.permissionItems()
                .filter(permission => permission.isRolePermission());
        }

        exportJson() {
            return {
                role: this.roleName(),
                permissions: this.getPermissionsList().map(p => ({ id: p.permission() })),
                users: this.getUsersList().map(u => ({ id: u.login })),
            };
        }

        importJson(jsonObject) {
            const jsonString = JSON.stringify(jsonObject)
            const isValid = this.validateJson(jsonString);
            if (!isValid) {
                throw Error();
            }
            return jsonString;
        }

        fixJsonErrors() {
            const json = this.importJSON();
            const newJson = roleJsonParser.fixRoles(json, this.validetedRoles, 'jsonIssues');
            this.importJSON(newJson);
            this.fixableValidationErrors(false);
        }

        fixJsonWarnings() {
            const json = this.importJSON();
            const newJson = roleJsonParser.fixRoles(json, this.validetedRoles, 'permissionSpecificIdsIssues');
            this.importJSON(newJson);
            this.fixableValidationWarnings(false);
        }

        validateJson(jsonString) {
            const usersMap = {};
            this.users().forEach(user => {
                usersMap[user.login] = user;
            });
            const permissionsMap = {};
            this.permissionList().forEach(p => {
                permissionsMap[p.permission] = p;
            });
            const existedRolesWithoutCurrent = this.existingRoles().filter(role => role.id !== this.currentRoleId());
            const parseJsonResult = roleJsonParser.validateAndParseRoles(jsonString, usersMap, permissionsMap, existedRolesWithoutCurrent);

            this.validationErrors(null);
            this.isJSONValid(true);
            this.validetedRoles = parseJsonResult.roles;

            if (!parseJsonResult.isValid || Boolean(parseJsonResult.error)){
                this.isJSONValid(false);
                this.validationErrors(parseJsonResult.error);
                return false;
            }

            if (parseJsonResult.roles.length > 1) {
                this.isJSONValid(false);
                this.validationErrors("You cannot import an array of roles.");
                return false;
            }
            const roleForImport = parseJsonResult.roles[0];

            if (roleForImport.rolePermissions.some(p => roleJsonParser.isPermissionContainExplicitId(p.id))) {
                this.fixableValidationWarnings(true)
            }

            if (!this.canEditRole() && this.roleName() !== roleForImport.role) {
                this.isJSONValid(false);
                this.validationErrors("You don't have enough privileges to change role name.");
                return false;
            }
            if (!this.isPermittedToImport(roleForImport)) {
                this.isJSONValid(false);
                this.fixableValidationErrors(true);
                return false;
            }


            return true;

        }

        setImportJsonToTheVariables (jsonString) {
            if (jsonString.length > 0 && this.isJSONValid()) {
                const role = JSON.parse(jsonString);

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

        isPermittedToImport(role) {
            return  role => (!role.permissions.unavailable.length && !role.users.unavailable.length);
        }

    }

    return commonUtils.build('utilities', UtilitieView, view);
});
