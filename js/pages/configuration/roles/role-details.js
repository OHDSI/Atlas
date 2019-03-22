define([
  'knockout',
  'text!./role-details.html',
  'components/Component',
  'utils/AutoBind',
  'utils/CommonUtils',
  'services/role',
  'lodash',
  'assets/ohdsi.util',
  'services/User',
  'services/AuthAPI',
  'atlas-state',
  'databindings',
  'components/ac-access-denied',
  'less!./role-details.less',
  'components/heading',
], (
  ko,
  view,
  Component,
  AutoBind,
  commonUtils,
  roleService,
  _,
  ohdsiUtils,
  userService,
  authApi,
  sharedState,
) => {
  const defaultRoleName = 'New Role';
  class RoleDetails extends AutoBind(Component) {
    constructor(params) {
      super(params);

      this.currentTab = ko.observable('users');

      this.model = params.model;
      this.roleId = sharedState.ConfigurationRole.selectedId;
      this.roleName = ko.observable();
      this.users = params.model.users;
      this.userItems = ko.observableArray();
      this.roleUserIds = [];

      this.permissions = sharedState.permissions;
      this.permissionItems = ko.observableArray();
      this.rolePermissionIds = [];

      this.loading = ko.observable();
      this.dirtyFlag = new ohdsiUtils.dirtyFlag({
        role: this.roleName,
        users: this.userItems,
        permissions: this.permissionItems,
      });
      this.roleDirtyFlag = new ohdsiUtils.dirtyFlag({
        role: this.roleName,
      });

      this.isNewRole = ko.pureComputed(() => this.roleId() === '0');
      this.roleCaption = ko.computed(() => this.isNewRole() ? 'New Role' : 'Role #' + this.roleId());
      this.isAuthenticated = authApi.isAuthenticated;
      this.canReadRoles = ko.pureComputed(() => this.isAuthenticated() && authApi.isPermittedReadRoles());
      this.canReadRole = ko.pureComputed(() => {
        return this.isAuthenticated() && this.isNewRole()
          ? authApi.isPermittedCreateRole()
          : authApi.isPermittedReadRole(this.roleId());
      });
      this.canEditRole = ko.pureComputed(() => {
        return this.isAuthenticated() && this.isNewRole()
          ? authApi.isPermittedCreateRole()
          : authApi.isPermittedEditRole(this.roleId());
      });
      this.canEditRoleUsers = ko.pureComputed(() => {
        return (
          this.isAuthenticated() &&
          (this.isNewRole() || authApi.isPermittedEditRoleUsers(this.roleId()))
        );
      });
      this.canEditRolePermissions = ko.pureComputed(() => {
        return (
          this.isAuthenticated() &&
          (this.isNewRole() || authApi.isPermittedEditRolePermissions(this.roleId()))
        );
      });
      this.hasAccess = ko.pureComputed(() => this.canReadRole());
      this.canDelete = ko.pureComputed(() => {
        return (
          this.isAuthenticated() &&
          this.roleId() &&
          authApi.isPermittedDeleteRole(this.roleId())
        );
      });
      this.canSave = ko.pureComputed(() => {
        return (
          (this.canEditRole() ||
            this.canEditRoleUsers() ||
            this.canEditRolePermissions()) &&
          this.roleName()
        );
      });
      this.canCreate = authApi.isPermittedCreateRole;
      this.areUsersSelected = ko.pureComputed(() => !!this.userItems().find(user => user.isRoleUser()));

      this.hasAccess() && this.updateRole();
    }

    selectAllUsers() {
      this.userItems().forEach(user => user.isRoleUser(true));
    }

    deselectAllUsers() {
      this.userItems().forEach(user => user.isRoleUser(false));
    }

    renderCheckbox(field, editable) {
      return editable
        ? `<span data-bind="click: (d) => { d.${field}(!d.${field}()); }, css: { selected: ${field} }" class="fa fa-check"></span>`
        : `<span data-bind="css: { selected: ${field} }" class="fa fa-check readonly"`;
    }

    async getRole() {
      const role = await roleService.load(this.roleId());
      this.roleName(role.role);
    }

    async getUsers() {
      if (!this.users() || this.users().length == 0) {
        const users = await userService.getUsers();
        this.users(users);
      }
    }

    async getRoleUsers() {
      const roleUsers = await roleService.getRoleUsers(this.roleId());
      roleUsers.forEach(user => this.roleUserIds.push(user.id));
    }

    async getPermissions() {
      if (!this.permissions() || this.permissions().length == 0) {
        const permissions = await roleService.getPermissions();
        this.permissions(permissions);
      }
    }

    async getRolePermissions() {
      const rolePermissions = await roleService.getRolePermissions(this.roleId());
      rolePermissions.forEach(permission => this.rolePermissionIds.push(permission.id));
    }

    updateUserItems() {
      const userItems = [];
      this.users().forEach(user => {
        const isRoleUser = this.roleUserIds.indexOf(user.id) >= 0;
        if (this.canEditRoleUsers() || isRoleUser) {
          userItems.push({
            id: user.id,
            login: user.login,
            isRoleUser: ko.observable(isRoleUser),
          });
        }
      });
      userItems.sort((a, b) => b.isRoleUser() - a.isRoleUser());
      this.userItems(userItems);
    }

    updatePermissionItems() {
      const permissionItems = [];
      this.permissions().forEach(permission => {
        const isRolePermission = this.rolePermissionIds.indexOf(permission.id) >= 0;
        if (this.canEditRolePermissions() || isRolePermission) {
          permissionItems.push({
            id: permission.id,
            permission: ko.observable(permission.permission),
            description: ko.observable(permission.description),
            isRolePermission: ko.observable(isRolePermission),
          });
        }
      });
      permissionItems.sort((a, b) => b.isRolePermission() - a.isRolePermission());
      this.permissionItems(permissionItems);
    }

    async updateRole() {
      this.loading(true);
      this.canReadRoles() && await this.model.updateRoles();

      if (this.isNewRole()) {
        this.roleName(defaultRoleName);
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
      this.updatePermissionItems();

      this.roleDirtyFlag.reset();
      this.dirtyFlag.reset();
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

    async saveUsers() {
      if (this.canEditRoleUsers()) {
        const currentRoleUserIds = this.userItems().filter(user => user.isRoleUser()).map(u => u.id);
        const userIdsToAdd = _.difference(currentRoleUserIds, this.roleUserIds);
        const userIdsToRemove = _.difference(this.roleUserIds, currentRoleUserIds);
        this.roleUserIds = currentRoleUserIds;

        await this.addRelations(userIdsToAdd, 'users');
        await this.removeRelations(userIdsToRemove, 'users');
      }
    }

    async savePermissions() {
      if (this.canEditRolePermissions()) {
        const currentRolePermissionIds = this.permissionItems().filter(permission => permission.isRolePermission()).map(u => u.id);
        const permissionIdsToAdd = _.difference(currentRolePermissionIds, this.rolePermissionIds);
        const permissionIdsToRemove = _.difference(this.rolePermissionIds, currentRolePermissionIds);

        this.rolePermissionIds = currentRolePermissionIds;

        await this.addRelations(permissionIdsToAdd, 'permissions');
        await this.removeRelations(permissionIdsToRemove, 'permissions');
      }
    }

    async saveRole() {
      if (!this.roleDirtyFlag.isDirty()) {
        return null;
      }

      const data = {
        id: this.roleId(),
        role: this.roleName(),
      };
      let role;

      if (this.isNewRole()) {
        role = await roleService.create(data);
      } else {
        role = await roleService.update(data);
      }

      this.roleId(role.id);
    }

    async save() {
      if (!this.roleName()) {
        alert('Please, specify Role name');
        return;
      }

      if (this.roleName() == defaultRoleName) {
        alert('Please, change Role name');
        return;
      }

      // check if such role already exists
      if (
        sharedState.roles().filter(role => {
            return role.id != this.roleId() && role.role == this.roleName();
        }).length > 0
      ) {
        alert('Role already exists!');
        return;
      }

      const create = this.isNewRole();

      this.loading(true);
      await this.saveRole();
      const roles = sharedState.roles();

      if (create) {
        roles.push({ id: this.roleId(), role: this.roleName() });
      } else {
        const updatedRole = roles.find(role => role.id == this.roleId());
        updatedRole.role = this.roleName();
      }
      sharedState.roles(roles);

      await authApi.loadUserInfo();
      await this.saveUsers();
      await this.savePermissions();
      this.roleDirtyFlag.reset();
      this.dirtyFlag.reset();
      commonUtils.routeTo('/role/' + this.roleId());
      this.loading(false);
    }

    close() {
      commonUtils.routeTo('/roles');
    }

    async delete() {
      this.loading(true);
      await roleService.delete(this.roleId());
      const roles = sharedState.roles().filter(role => role.id != this.roleId());
      sharedState.roles(roles);
      this.close();
      this.loading(false);
    }

    async copy() {
      const { id } = await roleService.create({ role: `${this.roleName()} copy` });
      await roleService.addRelations(id, 'users', this.roleUserIds);
      await roleService.addRelations(id, 'permissions', this.rolePermissionIds);
      commonUtils.routeTo(`/role/${id}`);
    }
  }

  return commonUtils.build('role-details', RoleDetails, view);
});
