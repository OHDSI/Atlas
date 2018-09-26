define([
  'providers/PermissionService'
], function (
  PermissionService
) {
	class UserPermissionService extends PermissionService {					
		isPermittedImportUsers() {
			return this.isPermitted('user:import:post') && this.isPermitted('user:import:*:post');
		}
	}

	return new UserPermissionService();
});
