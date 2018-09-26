define([
  'providers/PermissionService'
], function (
  PermissionService
) {
	class ConfigurationPermissionService extends PermissionService {					
		isPermittedEditConfiguration() {
      return this.isPermitted('configuration:edit:ui');
    }
	}

	return new ConfigurationPermissionService();
});
