define([
    'knockout',
    'atlas-state',
    'text!./utilities.html',
    'components/Component',
    'utils/AutoBind',
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
                self.validateJson(jsonString);
            });
            this.importService = this.importJson;
        }

        initFromParams(params) {
            this.dirtyFlag = params.dirtyFlag;
            this.exportService = params.exportJson;
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

        importJson(jsonObject) {
            const jsonString = JSON.stringify(jsonObject)
            this.validateJson(jsonString);
            if (!this.isJSONValid()) {
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
            this.validationWarnings(null)
            this.fixableValidationWarnings(null);
            this.validationErrors(null);
            this.fixableValidationErrors(null);

            const parseJsonResult = this.parseAndValidateJson(jsonString);
            this.validetedRoles = parseJsonResult.roles;

            //errors
            if (!parseJsonResult.isValid || Boolean(parseJsonResult.error)){
                this.validationErrors(parseJsonResult.error);
                this.isJSONValid(false);
                return;
            }
            if (parseJsonResult.roles.length > 1) {
                this.validationErrors("You cannot import an array of roles.");
                this.isJSONValid(false);
                return;
            }
            const roleForImport = parseJsonResult.roles[0];

            if (!this.canEditRole() && this.roleName() !== roleForImport.role) {
                this.validationErrors("You don't have enough privileges to change role name.");
                this.isJSONValid(false);
                return;
            }
            if (!this.isPermittedToImport(roleForImport)) {
                this.fixableValidationErrors(true);
                this.isJSONValid(false);
                return;
            }

            //warnings
            if (roleForImport.rolePermissions.some(p => roleJsonParser.isPermissionContainExplicitId(p.id))) {
                this.fixableValidationWarnings(true)
            }
            this.isJSONValid(true);
        }

        parseAndValidateJson(jsonString) {
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
            return parseJsonResult;
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
