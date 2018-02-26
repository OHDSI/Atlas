define(['knockout', 'text!./role-details.html', 'appConfig', 'ohdsi.util', 'databindings', 'access-denied'], function (ko, view, config, ohdsiUtils) {
    function roleDetails(params) {
        var self = this;
        var serviceUrl = config.api.url;
        var defaultRoleName = null;
        var authApi = params.model.authApi;

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

        self.isNewRole = ko.pureComputed(function() { return self.roleId() == 0; });

        self.isAuthenticated = authApi.isAuthenticated;
        self.canReadRoles = ko.pureComputed(function() { return self.isAuthenticated() && authApi.isPermittedReadRoles(); });
        self.canReadRole = ko.pureComputed(function() {
            return self.isAuthenticated() &&
                self.isNewRole()
                ? authApi.isPermittedCreateRole()
                : authApi.isPermittedReadRole(self.roleId());
        });
        self.canEditRole = ko.pureComputed(function() {
            return self.isAuthenticated() &&
                self.isNewRole()
                ? authApi.isPermittedCreateRole()
                : authApi.isPermittedEditRole(self.roleId());
        });
        self.canEditRoleUsers = ko.pureComputed(function() { return self.isAuthenticated() && (self.isNewRole() || authApi.isPermittedEditRoleUsers(self.roleId())); });
        self.canEditRolePermissions = ko.pureComputed(function() { return self.isAuthenticated() && (self.isNewRole() || authApi.isPermittedEditRolePermissions(self.roleId())); });
        self.hasAccess = ko.pureComputed(function() { return self.canReadRole(); });
        self.canDelete = ko.pureComputed(function() { return self.isAuthenticated() && self.roleId() && authApi.isPermittedDeleteRole(self.roleId()); });
        self.canSave = ko.pureComputed(function() { return self.canEditRole() || self.canEditRoleUsers() || self.canEditRolePermissions(); });

        self.renderCheckbox = function (field, editable) {
            return editable
                ? '<span data-bind="click: function(d) { d.' + field + '(!d.' + field + '()); } , css: { selected: ' + field + '}" class="fa fa-check"></span>'
                : '<span data-bind="css: { selected: ' + field + '}" class="fa fa-check readonly"></span>';
        }

        var getRole = function() {
            return $.ajax({
                url: serviceUrl + 'role/' + self.roleId(),
                method: 'GET',
                contentType: 'application/json',
                error: authApi.handleAccessDenied,
                success: function(data) {
                    self.roleName(data.role);
                }
            });
        }

        var getUsers = function() {
            if (!self.users() || self.users().length == 0) {
                return $.ajax({
                    url: serviceUrl + 'user',
                    method: 'GET',
                    contentType: 'application/json',
                    error: authApi.handleAccessDenied,
                    success: function(data) {
                        self.users(data);
                    }
                });
            } else {
                return null;
            }
        }
        var getRoleUsers = function() {
            return $.ajax({
                url: serviceUrl + 'role/' + self.roleId() + '/users',
                method: 'GET',
                contentType: 'application/json',
                error: authApi.handleAccessDenied,
                success: function (roleUsers) {
                    $.each(roleUsers, function (index, user) {
                        self.roleUserIds.push(user.id);
                    });
                }
            });
        }

        var getPermissions = function() {
            if (!self.permissions() || self.permissions().length == 0) {
                return $.ajax({
                    url: serviceUrl + 'permission',
                    method: 'GET',
                    contentType: 'application/json',
                    error: authApi.handleAccessDenied,
                    success: function (data) {
                        self.permissions(data);
                    }
                });
            } else {
                return null;
            }
        }

        var getRolePermissions = function() {
            return $.ajax({
                url: serviceUrl + 'role/' + self.roleId() + '/permissions',
                method: 'GET',
                contentType: 'application/json',
                error: authApi.handleAccessDenied,
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

            var rolesPromise =
                self.canReadRoles()
                    ? self.model.updateRoles()
                    : null;

            var rolePromise = null;
            var roleUsersPromise = null;
            var rolePermissionsPromise = null;

            if (self.isNewRole()) {
                self.roleName(defaultRoleName)
                self.roleUserIds = [];
                self.rolePermissionIds = [];
            } else {
                rolePromise = getRole();
                roleUsersPromise = getRoleUsers();
                rolePermissionsPromise = getRolePermissions();
            }

            var userItemsPromise = $.Deferred();
            $.when(getUsers(), roleUsersPromise).done(function() {
                updateUserItems();
                userItemsPromise.resolve();
            });

            var permissionItemsPromise = $.Deferred();
            $.when(getPermissions(), rolePermissionsPromise).done(function() {
                updatePermissionItems();
                permissionItemsPromise.resolve();
            });

            $.when(rolesPromise, rolePromise, userItemsPromise, permissionItemsPromise)
                .done(function() {
                    self.roleDirtyFlag.reset();
                    self.dirtyFlag.reset();
                })
                .always(function() { self.loading(false); });
        }

        var saveRelations = function(ids, relation, httpMethod) {
            return ids.length > 0
                ? $.ajax({
                    url: serviceUrl + 'role/' + self.roleId() + '/' + relation + '/' + ids.join('+'),
                    method: httpMethod,
                    contentType: 'application/json',
                    error: authApi.handleAccessDenied,
                })
                : null;
        }

        var arraysDiff = function(base, another) {
            return base.filter(function (i) {
                return another.indexOf(i) < 0;
            });
        }

        var saveUsers = function() {
            var currentRoleUserIds = [];
            $.each(self.userItems(), function(index, user) {
                if (user.isRoleUser()) {
                    currentRoleUserIds.push(user.id);
                }
            });

            var userIdsToAdd = arraysDiff(currentRoleUserIds, self.roleUserIds);
            var userIdsToRemove = arraysDiff(self.roleUserIds, currentRoleUserIds);
            self.roleUserIds = currentRoleUserIds;

            return $.when(
                saveRelations(userIdsToAdd, 'users', 'PUT'),
                saveRelations(userIdsToRemove, 'users', 'DELETE'));
        }

        var savePermissions = function () {
            var currentRolePermissionIds = [];
            $.each(self.permissionItems(), function(index, permission) {
                if (permission.isRolePermission()) {
                    currentRolePermissionIds.push(permission.id);
                }
            });

            var permissionIdsToAdd = arraysDiff(currentRolePermissionIds, self.rolePermissionIds);
            var permissionIdsToRemove = arraysDiff(self.rolePermissionIds, currentRolePermissionIds);
            self.rolePermissionIds = currentRolePermissionIds;

            return $.when(
                saveRelations(permissionIdsToAdd, 'permissions', 'PUT'),
                saveRelations(permissionIdsToRemove, 'permissions', 'DELETE'));
        }

        var saveRole = function () {
            if (!self.roleDirtyFlag.isDirty()) {
                return null;
            }

            var data = ko.toJSON({
                id: self.roleId(),
                role: self.roleName()
            });

            return self.isNewRole()
                ? $.ajax({
                    url: serviceUrl + 'role',
                    method: 'POST',
                    contentType: 'application/json',
                    data: data,
                    dataType: 'json',
                    error: authApi.handleAccessDenied,
                    success: function(data) {
                        self.roleId(data.id);
                    }
                })
                : $.ajax({
                    url: serviceUrl + 'role/' + self.roleId(),
                    method: 'PUT',
                    contentType: 'application/json',
                    data: data,
                    dataType: 'json',
                    error: authApi.handleAccessDenied,
                    success: function(data) {
                        self.roleId(data.id);
                    }
                });
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
            $.when(saveRole()).done(function () {
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
                        savePermissions())
                    .done(function() {
                        authApi.refreshToken().done(function() {
                            self.roleDirtyFlag.reset();
                            self.dirtyFlag.reset();
                            document.location = '#/role/' + self.roleId();
                        });
                    })
                    .always(function() { self.loading(false); });
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
                contentType: 'application/json',
                error: authApi.handleAccessDenied,
                success: function () {
                    authApi.refreshToken();
                    var roles = self.model.roles().filter(function (role) {
                        return role.id != self.roleId();
                    });
                    self.model.roles(roles);
                    self.close();
                },
                complete: function() {
                    self.loading(false);
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
