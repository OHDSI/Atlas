define([
    'knockout',
    'text!./role-details.html',
    'providers/Component',
    'providers/AutoBind',
    'utils/CommonUtils',
    'services/http',
    '../const',
    'appConfig',
    'assets/ohdsi.util',
    'services/User',
    'webapi/AuthAPI',
    'databindings',
    'components/ac-access-denied',
    'less!./role-details.less',
    'components/heading'
], function (
    ko,
    view,
    Component,
    AutoBind,
    commonUtils,
    httpService,
    constants,
    config,
    ohdsiUtils,
    userService,
    authApi,
) {
    const defaultRoleName = null;
    class RoleDetails extends AutoBind(Component) {
        constructor(params) {
            super(params);        

            this.currentTab = ko.observable('users');

            this.model = params.model;
            this.roleId = params.model.currentRoleId;
            this.roleName = ko.observable();

            this.users = params.model.users;
            this.userItems = ko.observableArray();
            this.roleUserIds = [];

            this.permissions = params.model.permissions;
            this.permissionItems = ko.observableArray();
            this.rolePermissionIds = [];

            this.loading = ko.observable();
            this.dirtyFlag = new ohdsiUtils.dirtyFlag({
                role: this.roleName,
                users: this.userItems,
                permissions: this.permissionItems
            });
            this.roleDirtyFlag = new ohdsiUtils.dirtyFlag({
                role: this.roleName
            });

            this.isNewRole = ko.pureComputed(() => { return this.roleId() == 0; });

            this.isAuthenticated = authApi.isAuthenticated;
            this.canReadRoles = ko.pureComputed(() => { return this.isAuthenticated() && authApi.isPermittedReadRoles(); });
            this.canReadRole = ko.pureComputed(() => {
                return this.isAuthenticated() &&
                    this.isNewRole()
                    ? authApi.isPermittedCreateRole()
                    : authApi.isPermittedReadRole(this.roleId());
            });
            this.canEditRole = ko.pureComputed(() => {
                return this.isAuthenticated() &&
                    this.isNewRole()
                    ? authApi.isPermittedCreateRole()
                    : authApi.isPermittedEditRole(this.roleId());
            });
            this.canEditRoleUsers = ko.pureComputed(() => { return this.isAuthenticated() && (this.isNewRole() || authApi.isPermittedEditRoleUsers(this.roleId())); });
            this.canEditRolePermissions = ko.pureComputed(() => { return this.isAuthenticated() && (this.isNewRole() || authApi.isPermittedEditRolePermissions(this.roleId())); });
            this.hasAccess = ko.pureComputed(() => { return this.canReadRole(); });
            this.canDelete = ko.pureComputed(() => { return this.isAuthenticated() && this.roleId() && authApi.isPermittedDeleteRole(this.roleId()); });
            this.canSave = ko.pureComputed(() => { return this.canEditRole() || this.canEditRoleUsers() || this.canEditRolePermissions(); });

            this.areUsersSelected = ko.pureComputed(() => { return !!this.userItems().find(user => user.isRoleUser()); });        
                
            if (this.hasAccess()) {
                this.updateRole();
            }
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

        getRole() {
            return httpService.doGet(constants.paths.role(this.roleId()))
                .then(({ data }) => {
                    this.roleName(data.role);
                });
        }

        getUsers() {
            if (!this.users() || this.users().length == 0) {
                return userService.getUsers().then((data) => this.users(data));
            } else {
                return Promise.resolve();
            }
        }
        getRoleUsers() {
            return httpService.doGet(constants.paths.roleUsers(this.roleId()))
                .then(({ data: roleUsers }) => {
                    roleUsers.forEach((user) => {
                        this.roleUserIds.push(user.id);
                    });
                });
        }

        getPermissions() {
            if (!this.permissions() || this.permissions().length == 0) {
                return httpService.doGet(constants.paths.permissions())
                .then(({ data }) => {
                    this.permissions(data);
                });                
            } else {
                return Promise.resolve();
            }
        }

        getRolePermissions() {
            return httpService.doGet(constants.paths.rolePermissions(this.roleId()))
                .then(({ data: rolePermissions }) => {
                    rolePermissions.forEach((permission) => {
                        this.rolePermissionIds.push(permission.id);
                    });
                });
        }

        updateUserItems() {
            const userItems = [];
            this.users().forEach((user) => {
                const isRoleUser = this.roleUserIds.indexOf(user.id) >= 0;
                if (this.canEditRoleUsers() || isRoleUser) {
                    userItems.push({
                        id: user.id,
                        login: user.login,
                        isRoleUser: ko.observable(isRoleUser),
                    });
                }
            });
            userItems.sort(function (a, b) {
                return b.isRoleUser() - a.isRoleUser();
            })
            this.userItems(userItems);
        }

        updatePermissionItems() {
            const permissionItems = [];
            this.permissions().forEach((permission) => {
                const isRolePermission = this.rolePermissionIds.indexOf(permission.id) >= 0;
                if (this.canEditRolePermissions() || isRolePermission) {
                    permissionItems.push({
                        id: permission.id,
                        permission: ko.observable(permission.permission),
                        description: ko.observable(permission.description),
                        isRolePermission: ko.observable(isRolePermission)
                    });
                }
            });
            permissionItems.sort(function (a, b) {
                return b.isRolePermission() - a.isRolePermission();
            });
            this.permissionItems(permissionItems);
        }


        async updateRole () {
            this.loading(true);
            if (this.canReadRoles()) {
                await this.model.updateRoles();
            }
            if (this.isNewRole()) {
                this.roleName(defaultRoleName)
                this.roleUserIds = [];
                this.rolePermissionIds = [];
            } else {
                await this.getRole();
                await this.getRoleUsers();
                await this.getRolePermissions();
            }
            await this.getUsers();
            this.updateUserItems();

            await this.getPermissions();
            this.updatePermissionItems()

            this.roleDirtyFlag.reset();
            this.dirtyFlag.reset();
            this.loading(false);
        }

        addRelations(ids, relation) {
            return ids.length > 0
                ? httpService.doPut(constants.paths.relations(this.roleId(), relation, ids))
                : Promise.resolve();
        }
        removeRelations(ids, relation) {
            return ids.length > 0
                ? httpService.doDelete(constants.paths.relations(this.roleId(), relation, ids))
                : Promise.resolve();
        }

        saveUsers() {
            const currentRoleUserIds = this.userItems()
                .filter(user => user.isRoleUser());

            var userIdsToAdd = constants.arraysDiff(currentRoleUserIds, this.roleUserIds).map(u => u.id);
            var userIdsToRemove = constants.arraysDiff(this.roleUserIds, currentRoleUserIds).map(u => u.id);
            this.roleUserIds = currentRoleUserIds;

            return Promise.all([
                this.addRelations(userIdsToAdd, 'users', 'PUT'),
                this.removeRelations(userIdsToRemove, 'users', 'DELETE'),
            ]);
        }

        savePermissions() {
            var currentRolePermissionIds = this.permissionItems()
                .filter(permission => permission.isRolePermission());

            var permissionIdsToAdd = constants.arraysDiff(currentRolePermissionIds, this.rolePermissionIds).map(u => u.id);
            var permissionIdsToRemove = constants.arraysDiff(this.rolePermissionIds, currentRolePermissionIds).map(u => u.id);
            this.rolePermissionIds = currentRolePermissionIds;

            return Promise.all([
                this.addRelations(permissionIdsToAdd, 'permissions', 'PUT'),
                this.removeRelations(permissionIdsToRemove, 'permissions', 'DELETE'),
            ]);
        }

        saveRole() {
            if (!this.roleDirtyFlag.isDirty()) {
                return null;
            }

            const data = {
                id: this.roleId(),
                role: this.roleName()
            };

            const promise = this.isNewRole()
                ? httpService.doPost(constants.paths.role(), data)
                : httpService.doPut(constants.paths.role(this.roleId()), data);

            return promise.then(({ data }) => {
                this.roleId(data.id);
            });
        }

        async save() {
            if (!this.roleName) {
                alert("Please, specify Role name");
                return;
            }

            if (this.roleName() == defaultRoleName) {
                alert("Please, change Role name");
                return;
            }

            // check if such role already exists
            if (this.model.roles()
                .filter((role) => {
                    return (role.id != this.roleId()
                        && role.role == this.roleName());
                    }).length > 0)
            {
                alert("Role already exists!")
                return;
            }

            const create = this.isNewRole();

            this.loading(true);
            await this.saveRole();
            const roles = this.model.roles();
            if (create) {
                roles.push({
                    id: this.roleId(),
                    role: this.roleName()
                });
            } else {
                const updatedRole = roles.find((role) => {
                    return role.id == this.roleId();
                });
                updatedRole.role = this.roleName();
            }
            this.model.roles(roles);

            await this.saveUsers();
            await this.savePermissions();
            this.roleDirtyFlag.reset();
            this.dirtyFlag.reset();
            document.location = '#/role/' + this.roleId();
            this.loading(false);
        }

        close() {
            document.location = "#/roles";
        }

        async delete() {
            this.loading(true);
            await httpService.doDelete(constants.paths.role(this.roleId()));
            var roles = this.model.roles().filter((role) => {
                return role.id != this.roleId();
            });
            this.model.roles(roles);
            this.close();
            this.loading(false);
        }

    }

    return commonUtils.build('role-details', RoleDetails, view);
});
