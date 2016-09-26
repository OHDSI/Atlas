define(['knockout', 'text!./role-details.html', 'appConfig', 'webapi/AuthAPI', 'ohdsi.util', 'knockout.dataTables.binding', 'access-denied'], function (ko, view, config, authApi, ohdsiUtils) {
    function roleDetails(params) {
        var self = this;
        var serviceUrl = config.services[0].url;
        var defaultRoleName = null;

        self.currentTab = ko.observable('users');

        self.model = params.model;
        self.roleId = params.model.currentRoleId;
        self.roleName = ko.observable();

        self.users = params.model.users;
        self.userItems = ko.observableArray();
        self.roleUserIds = [];

        self.permissions = params.model.permissions;
        self.permissionItems = ko.observableArray();
        self.rolePermissionIds = [];

        self.loading = ko.observable();
        self.dirtyFlag = new ohdsiUtils.dirtyFlag({
            role: self.roleName,
            users: self.userItems,
            permissions: self.permissionItems
        });
        self.roleDirtyFlag = new ohdsiUtils.dirtyFlag({
            role: self.roleName
        });

        self.isNewRole = ko.computed(function() { return self.roleId() == 0; });

        self.isAuthenticated = ko.observable();
        self.canReadRoles = ko.observable();
        self.canReadRole = ko.observable();
        self.canEditRole = ko.observable();
        self.canEditRoleUsers = ko.observable();
        self.canEditRolePermissions = ko.observable();
        self.hasAccess = ko.observable();
        self.canDelete = ko.observable();
        self.canSave = ko.observable();

        var updateAccessControl = function() {
            self.isAuthenticated(authApi.isAuthenticated());
            self.canReadRole(
                self.isAuthenticated() &&
                self.isNewRole()
                ? authApi.isPermittedCreateRole()
                : authApi.isPermittedReadRole(self.roleId()));
            self.canReadRoles(self.isAuthenticated() && authApi.isPermittedReadRoles());
            self.canEditRole(
                self.isAuthenticated() &&
                self.isNewRole()
                ? authApi.isPermittedCreateRole()
                : authApi.isPermittedEditRole(self.roleId()));
            self.canEditRoleUsers(self.isAuthenticated() && (self.isNewRole() || authApi.isPermittedEditRoleUsers(self.roleId())));
            self.canEditRolePermissions(self.isAuthenticated() && (self.isNewRole() || authApi.isPermittedEditRolePermissions(self.roleId())));
            self.hasAccess(self.canReadRole());
            self.canDelete(self.isAuthenticated() && self.roleId() && authApi.isPermittedDeleteRole(self.roleId()));
            self.canSave(self.canEditRole() || self.canEditRoleUsers() || self.canEditRolePermissions());
        }
        updateAccessControl();

        self.renderCheckbox = function (field, editable) {
            return editable
                ? '<span data-bind="click: function(d) { d.' + field + '(!d.' + field + '()); } , css: { selected: ' + field + '}" class="fa fa-check"></span>'
                : '<span data-bind="css: { selected: ' + field + '}" class="fa fa-check readonly"></span>';
        }

        var getRole = function() {
            return $.ajax({
                url: serviceUrl + 'role/' + self.roleId(),
                method: 'GET',
                headers: {
                    Authorization: authApi.getAuthorizationHeader()
                },
                contentType: 'application/json',
                success: function(data) {
                    self.roleName(data.role);
                }
            });
        }

        var getUsers = function() {
            var promise = $.Deferred();

            if (!self.users() || self.users().length == 0) {
                $.ajax({
                    url: serviceUrl + 'user',
                    method: 'GET',
                    headers: {
                        Authorization: authApi.getAuthorizationHeader()
                    },
                    contentType: 'application/json',
                    success: function(data) {
                        self.users(data);
                        promise.resolve();
                    }
                });
            } else {
                promise.resolve();
            }

            return promise;
        }
        var getRoleUsers = function() {
            return $.ajax({
                url: serviceUrl + 'role/' + self.roleId() + '/users',
                method: 'GET',
                headers: {
                    Authorization: authApi.getAuthorizationHeader()
                },
                contentType: 'application/json',
                success: function (roleUsers) {
                    $.each(roleUsers, function (index, user) {
                        self.roleUserIds.push(user.id);
                    });
                }
            });
        }

        var getPermissions = function() {
            var promise = $.Deferred();

            if (!self.permissions() || self.permissions().length == 0) {
                $.ajax({
                    url: serviceUrl + 'permission',
                    method: 'GET',
                    headers: {
                        Authorization: authApi.getAuthorizationHeader()
                    },
                    contentType: 'application/json',
                    success: function (data) {
                        self.permissions(data);
                        promise.resolve();
                    }
                });
            } else {
                promise.resolve();
            }

            return promise;
        }

        var getRolePermissions = function() {
            return $.ajax({
                url: serviceUrl + 'role/' + self.roleId() + '/permissions',
                method: 'GET',
                headers: {
                    Authorization: authApi.getAuthorizationHeader()
                },
                contentType: 'application/json',
                success: function(rolePermissions) {
                    $.each(rolePermissions, function(index, permission) {
                        self.rolePermissionIds.push(permission.id);
                    });
                }
            });
        }

        var updateUserItems = function () {
            var userItems = [];
            $.each(self.users(), function (index, user) {
                var isRoleUser = self.roleUserIds.indexOf(user.id) >= 0;
                if (self.canEditRoleUsers() || isRoleUser) {
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
            self.userItems(userItems);
        }

        var updatePermissionItems = function () {
            var permissionItems = [];
            $.each(self.permissions(), function (index, permission) {
                var isRolePermission = self.rolePermissionIds.indexOf(permission.id) >= 0;
                if (self.canEditRolePermissions() || isRolePermission) {
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
            self.permissionItems(permissionItems);
        }


        self.updateRole = function () {
            self.loading(true);

            var rolesPromise = $.Deferred();
            if (self.canReadRoles()) {
                self.model.updateRoles().done(rolesPromise.resolve);
            } else {
                rolesPromise.resolve();
            }

            var usersPromise = getUsers();
            var permissionsPromise = getPermissions();

            var rolePromise = $.Deferred();
            var roleUsersPromise = $.Deferred();
            var rolePermissionsPromise = $.Deferred();

            if (self.isNewRole()) {
                self.roleName(defaultRoleName)
                rolePromise.resolve();

                self.roleUserIds = [];
                roleUsersPromise.resolve();

                self.rolePermissionIds = [];
                rolePermissionsPromise.resolve();
            } else {
                getRole().done(rolePromise.resolve);
                getRoleUsers().done(roleUsersPromise.resolve);
                getRolePermissions().done(rolePermissionsPromise.resolve)
            }

            var userItemsPromise = $.Deferred();
            $.when(usersPromise, roleUsersPromise).done(function() {
                updateUserItems();
                userItemsPromise.resolve();
            });

            var permissionItemsPromise = $.Deferred();
            $.when(permissionsPromise, rolePermissionsPromise).done(function() {
                updatePermissionItems();
                permissionItemsPromise.resolve();
            });

            $.when(rolesPromise, rolePromise, userItemsPromise, permissionItemsPromise).done(function () {
                self.roleDirtyFlag.reset();
                self.dirtyFlag.reset();
                self.loading(false);
            });
        }

        var saveRelations = function(ids, relation, httpMethod) {
            var promise = $.Deferred();

            if (ids.length > 0) {
                $.ajax({
                    url: serviceUrl + 'role/' + self.roleId() + '/' + relation + '/' + ids.join('+'),
                    method: httpMethod,
                    headers: {
                        Authorization: authApi.getAuthorizationHeader()
                    },
                    contentType: 'application/json',
                    success: function(data) {
                        promise.resolve();
                    }
                });
            } else {
                promise.resolve();
            }

            return promise;
        }

        var arraysDiff = function(base, another) {
            return base.filter(function (i) {
                return another.indexOf(i) < 0;
            });
        }

        var saveUsers = function() {
            var promise = $.Deferred();

            var currentRoleUserIds = [];
            $.each(self.userItems(), function(index, user) {
                if (user.isRoleUser()) {
                    currentRoleUserIds.push(user.id);
                }
            });

            var userIdsToAdd = arraysDiff(currentRoleUserIds, self.roleUserIds);
            var userIdsToRemove = arraysDiff(self.roleUserIds, currentRoleUserIds);
            self.roleUserIds = currentRoleUserIds;

            $.when(
                saveRelations(userIdsToAdd, 'users', 'PUT'),
                saveRelations(userIdsToRemove, 'users', 'DELETE'))
            .done(promise.resolve);

            return promise;
        }

        var savePermissions = function () {
            var promise = $.Deferred();

            var currentRolePermissionIds = [];
            $.each(self.permissionItems(), function(index, permission) {
                if (permission.isRolePermission()) {
                    currentRolePermissionIds.push(permission.id);
                }
            });

            var permissionIdsToAdd = arraysDiff(currentRolePermissionIds, self.rolePermissionIds);
            var permissionIdsToRemove = arraysDiff(self.rolePermissionIds, currentRolePermissionIds);
            self.rolePermissionIds = currentRolePermissionIds;

            $.when(
                saveRelations(permissionIdsToAdd, 'permissions', 'PUT'),
                saveRelations(permissionIdsToRemove, 'permissions', 'DELETE'))
            .done(promise.resolve);

            return promise;
        }

        var saveRole = function () {
            var promise = $.Deferred();
            if (!self.roleDirtyFlag.isDirty()) {
                promise.resolve();
                return promise;
            }

            var data = ko.toJSON({
                id: self.roleId(),
                role: self.roleName()
            });

            return self.isNewRole()
                ? $.ajax({
                    url: serviceUrl + 'role',
                    method: 'PUT',
                    headers: {
                        Authorization: authApi.getAuthorizationHeader()
                    },
                    contentType: 'application/json',
                    data: data,
                    dataType: 'json',
                    success: function(data) {
                        self.roleId(data.id);
                        promise.resolve();
                    }
                })
                : $.ajax({
                    url: serviceUrl + 'role/' + self.roleId(),
                    method: 'POST',
                    headers: {
                        Authorization: authApi.getAuthorizationHeader()
                    },
                    contentType: 'application/json',
                    data: data,
                    dataType: 'json',
                    success: function(data) {
                        self.roleId(data.id);
                        promise.resolve();
                    }
                });

            return promise;
        }

        self.save = function () {
            if (!self.roleName) {
                alert("Please, specify Role name");
                return;
            }

            if (self.roleName() == defaultRoleName) {
                alert("Please, change Role name");
                return;
            }

            // check if such role already exists
            if (self.model.roles()
                .filter(function(role) { return role.id != self.roleId() && role.role == self.roleName(); })
                .length > 0)
            {
                alert("Role already exists!")
                return;
            }

            var create = self.isNewRole();

            self.loading(true);
            saveRole().done(function () {
                var roles = self.model.roles();
                if (create) {
                    roles.push({
                        id: self.roleId(),
                        role: self.roleName()
                    });
                } else {
                    var updatedRole = roles.find(function(role) {
                        return role.id == self.roleId();
                    });
                    updatedRole.role = self.roleName();
                }
                self.model.roles(roles);

                $.when(
                    saveUsers(),
                    savePermissions()
                ).done(function () {
                    authApi.refreshToken().done(function () {
                        updateAccessControl();
                        self.roleDirtyFlag.reset();
                        self.dirtyFlag.reset();
                        document.location = '#/role/' + self.roleId();
                        self.loading(false);
                    });
                });
            });
        }

        self.close = function () {
            document.location = "#/roles";
        }

        self.delete = function () {
            self.loading(true);
            $.ajax({
                url: serviceUrl + 'role/' + self.roleId(),
                method: 'DELETE',
                headers: {
                    Authorization: authApi.getAuthorizationHeader()
                },
                contentType: 'application/json',
                success: function () {
                    authApi.refreshToken();
                    var roles = self.model.roles().filter(function (role) {
                        return role.id != self.roleId();
                    });
                    self.model.roles(roles);
                    self.loading(false);
                    self.close();
                }
            });
        }

        if (self.hasAccess()) {
            self.updateRole();
        }
    }

    var component = {
        viewModel: roleDetails,
        template: view
    };

    ko.components.register('role-details', component);
    return component;
});
