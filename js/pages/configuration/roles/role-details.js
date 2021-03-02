define([
    'knockout',
    'atlas-state',
    'text!./role-details.html',
    'pages/Page',
    'utils/AutoBind',
    'utils/CommonUtils',
    'utils/Clipboard',
    'pages/configuration/roles/roleJsonParser',
    'services/role',
    'lodash',
    'assets/ohdsi.util',
    'services/User',
    'services/AuthAPI',
    'services/file',
    'databindings',
    'components/ac-access-denied',
    'less!./role-details.less',
    'components/heading',
    './components/users',
    './components/permissions',
    './components/utilities',
    'components/tabs'


], function (
    ko,
    sharedState,
    view,
    Page,
    AutoBind,
    commonUtils,
    Clipboard,
    roleJsonParser,
    roleService,
    _,
    ohdsiUtils,
    userService,
    authApi,
    fileService,
) {
    const defaultRoleName = "New Role";

    class RoleDetails extends AutoBind(Clipboard(Page)) {
        constructor(params) {
            super(params);

            this.currentTab = ko.observable('users');

            this.roleId = ko.observable();
            this.roleName = ko.observable();
            this.roles = sharedState.roles;
            this.users = sharedState.users;
            this.userItems = ko.observableArray();
            this.existingRoles = ko.observableArray();
            this.roleUserIds = [];
            this.permissions = ko.observableArray();
            this.permissionItems = ko.observableArray();
            this.rolePermissionIds = [];


            this.isNewRole = ko.pureComputed(() => this.roleId() === 0);

            this.roleCaption = ko.computed(() => this.isNewRole() ? ko.i18n('const.newEntityNames.role', 'New Role')() : ko.i18nformat('configuration.roles.roleTitle', 'Role #<%=id%>', {id: this.roleId()}));

            this.isAuthenticated = authApi.isAuthenticated;
            this.canReadRoles = ko.pureComputed(() => this.isAuthenticated() && authApi.isPermittedReadRoles());
            this.canReadRole = ko.pureComputed(() =>
                this.isAuthenticated() &&
                this.isNewRole()
                    ? authApi.isPermittedCreateRole()
                    : authApi.isPermittedReadRole(this.roleId()));
            this.canEditRole = ko.pureComputed(() =>
                this.isAuthenticated() &&
                this.isNewRole()
                    ? authApi.isPermittedCreateRole()
                    : authApi.isPermittedEditRole(this.roleId()));
            this.canEditRoleUsers = ko.pureComputed(() => this.isAuthenticated() && (this.isNewRole() || authApi.isPermittedEditRoleUsers(this.roleId())));
            this.canEditRolePermissions = ko.pureComputed(() => this.isAuthenticated() && (this.isNewRole() || authApi.isPermittedEditRolePermissions(this.roleId())));
            this.hasAccess = ko.pureComputed(() => this.canReadRole());
            this.canDelete = ko.pureComputed(() => this.isAuthenticated() && this.roleId() && authApi.isPermittedDeleteRole(this.roleId()));
            this.canSave = ko.pureComputed(() => (this.canEditRole() || this.canEditRoleUsers() || this.canEditRolePermissions()) && this.roleName());
            this.canCreate = authApi.isPermittedCreateRole;

            this.areUsersSelected = ko.pureComputed(() => {
                return !!this.userItems().find(user => user.isRoleUser());
            });

            this.loading = ko.observable();
            this.dirtyFlag = ko.observable(new ohdsiUtils.dirtyFlag({
                role: this.roleName,
                users: this.userItems,
                permissions: this.permissionItems
            }));
            this.roleDirtyFlag = ko.observable(new ohdsiUtils.dirtyFlag({
                role: this.roleName
            }));

            this.initializeParamsForTabs(params);

        }

        initializeParamsForTabs(params) {
            this.componentParams = params;

            this.componentParams.isNewRole = this.isNewRole;
            this.componentParams.roleId = this.roleId;
            this.componentParams.roleName = this.roleName;
            this.componentParams.roles = this.existingRoles;

            this.componentParams.userItems = this.userItems;
            this.componentParams.permissionItems = this.permissionItems;
            this.componentParams.exportJson = this.exportJson;
            this.componentParams.permissions = this.permissions;
            this.componentParams.save = this.save;

            this.componentParams.dirtyFlag = this.dirtyFlag;
            this.componentParams.canReadRole = this.canReadRole;
            this.componentParams.canReadRoles = this.canReadRoles;
            this.componentParams.canEditRole = this.canEditRole;
            this.componentParams.canEditRoleUsers = this.canEditRoleUsers;
            this.componentParams.canEditRolePermissions = this.canEditRolePermissions;
        }

        onRouterParamsChanged({roleId}) {
            if (this.hasAccess()) {
                this.roleId(roleId);
                this.updateRole();
            }
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

        getPermissionsList() {
            return this.permissionItems()
                .filter(permission => permission.isRolePermission());
        }

        getUsersList() {
            return this.userItems()
                .filter(user => user.isRoleUser());
        }

        exportJson() {
            return {
                role: this.roleName(),
                permissions: this.getPermissionsList().map(p => ({ id: p.permission() })),
                users: this.getUsersList().map(u => ({ id: u.login })),
            };
        }

        export() {
            fileService.saveAsJson(this.exportJson());
        }

        close() {
            commonUtils.routeTo("/roles");
        }

        async getRole() {
            const role = await roleService.load(this.roleId());
            this.currentRole = role;
            this.roleName(role.role);
        }

        async getRoleUsers() {
            const roleUsers = await roleService.getRoleUsers(this.roleId());
            roleUsers.forEach((user) => {
                this.roleUserIds.push(user.id);
            });
        }

        async getExistingUsers() {
            if (!this.users() || this.users().length == 0) {
                const users = await userService.getUsers();
                this.users(users);
            }
        }

        async getExistingRoles() {
            const roles = await roleService.getList();
            this.existingRoles(roles);
        }

        async getExistingPermissions() {
            if (!this.permissions() || this.permissions().length == 0) {
                const permissions = await roleService.getPermissions();
                this.permissions(permissions);
            }
        }

        async getRolePermissions() {
            const rolePermissions = await roleService.getRolePermissions(this.roleId());
            rolePermissions.forEach((permission) => {
                this.rolePermissionIds.push(permission.id);
            });
        }

        async updateRole() {
            this.loading(true);
            if (this.canReadRoles()) {
                await roleService.updateRoles();
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

            await this.getExistingRoles();
            await this.getExistingUsers();
            await this.getExistingPermissions();

            this.updateUserItems();
            this.updatePermissionItems()

            this.roleDirtyFlag().reset();
            this.dirtyFlag().reset();
            this.loading(false);
        }

        async addRelations(ids, relation) {
            if (ids.length > 0) {
                return await roleService.addRelations(this.roleId(), relation, ids);
            }
        }

        async removeRelations(ids, relation) {
            if (ids.length > 0) {
                return await roleService.removeRelations(this.roleId(), relation, ids);
            }
        }

        async saveRole() {
            if (!this.roleDirtyFlag().isDirty()) {
                return null;
            }

            const data = {
                id: this.roleId(),
                role: this.roleName()
            };
            let role;

            if (this.isNewRole()) {
                role = await roleService.create(data);
            } else {
                role = await roleService.update(data);
            }

            this.roleId(role.id);
        }

        async saveUsers() {
            if (this.canEditRoleUsers()) {
                const currentRoleUserIds = this.getUsersList().map(u => u.id);
                var userIdsToAdd = _.difference(currentRoleUserIds, this.roleUserIds);
                var userIdsToRemove = _.difference(this.roleUserIds, currentRoleUserIds);
                this.roleUserIds = currentRoleUserIds;

                await this.addRelations(userIdsToAdd, 'users');
                await this.removeRelations(userIdsToRemove, 'users');
            }
        }

        async savePermissions() {
            if (this.canEditRolePermissions()) {
                var currentRolePermissionIds = this.getPermissionsList().map(p => p.id);

                var permissionIdsToAdd = _.difference(currentRolePermissionIds, this.rolePermissionIds);
                var permissionIdsToRemove = _.difference(this.rolePermissionIds, currentRolePermissionIds);
                this.rolePermissionIds = currentRolePermissionIds;

                await this.addRelations(permissionIdsToAdd, 'permissions');
                await this.removeRelations(permissionIdsToRemove, 'permissions');
            }
        }

        async save() {
            if (!this.validate()) {
                return;
            }

            this.loading(true);
            const newRole = this.isNewRole();
            await this.saveRole();
            const roles = this.roles();
            if (newRole) {
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
            this.roles(roles);

            await authApi.loadUserInfo();
            await this.saveUsers();
            await this.savePermissions();
            this.roleDirtyFlag().reset();
            this.dirtyFlag().reset();
            commonUtils.routeTo('/role/' + this.roleId());
            this.loading(false);
        }

        validate() {
            if (!this.dirtyFlag().isDirty()) {
                alert("No changes. There is nothing to save");
                return false;
            }
            if (!this.roleName()) {
                alert("Please, specify Role name");
                return false;
            }

            if (this.roleName() == defaultRoleName) {
                alert("Please, change Role name");
                return false;
            }

            // check if such role already exists
            if (this.roles()
                .filter((role) => {
                    return (role.id != this.roleId()
                        && role.role == this.roleName());
                }).length > 0) {
                alert("Role already exists!")
                return false;
            }
            return true;
        }

        async copy() {
            let id;
            try {
                const response = await roleService.create({role: `${this.roleName()} copy`});
                id = response.id;
                await roleService.addRelations(id, 'users', this.roleUserIds);
                await roleService.addRelations(id, 'permissions', this.rolePermissionIds);
            } catch (er) {
                if (!id) {
                    alert("Failed to copy role");
                } else {
                    alert("Failed to fully copy the role");
                }
            }
            await roleService.updateRoles();
            if (id) {
                commonUtils.routeTo(`/role/${id}`);
            }
        }

        async delete() {
            commonUtils.confirmAndDelete({
                message: "Are you sure you want to delete the role?",
                loading: this.loading,
                remove: () => roleService.delete(this.roleId()),
                redirect: () => {
                    const roles = this.roles().filter((role) => {
                        return role.id !== this.roleId();
                    });
                    sharedState.roles(roles);
                    this.close();
                    this.loading(false);
                }
            });
        }
    }

    return commonUtils.build('role-details', RoleDetails, view);
});
