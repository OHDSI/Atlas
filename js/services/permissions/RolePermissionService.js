define([
  'providers/PermissionService'
], function (
  PermissionService
) {
	class RolePermissionService extends PermissionService {
		isPermittedReadRoles() {
				return this.isPermitted('role:get');
		}
		isPermittedReadRole(roleId) {
				var permitted =
            this.isPermitted('role:' + roleId + ':get') &&
            this.isPermitted('permission:get') &&
            this.isPermitted('role:' + roleId + ':permissions:get') &&
            this.isPermitted('user:get') &&
            this.isPermitted('role:' + roleId + ':users:get');
				return permitted;
		}
		isPermittedEditRole(roleId) {
				return this.isPermitted('role:' + roleId + ':put');
		}
		isPermittedCreateRole() {
				return this.isPermitted('role:post');
		}
		isPermittedDeleteRole(roleId) {
				return this.isPermitted('role:' + roleId + ':delete');
		}
		isPermittedEditRoleUsers(roleId) {
				return this.isPermitted('role:' + roleId + ':users:*:put') && this.isPermitted('role:' + roleId + ':users:*:delete');
		}
		isPermittedEditRolePermissions(roleId) {
				return this.isPermitted('role:' + roleId + ':permissions:*:put') && this.isPermitted('role:' + roleId + ':permissions:*:delete');
		}
	}

	return new RolePermissionService();
});
