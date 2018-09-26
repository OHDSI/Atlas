define([
  'providers/PermissionService'
], function (
  PermissionService
) {
	class ProfilePermissionService extends PermissionService {				
    isPermittedViewProfiles() {
			return this.isPermitted('*:person:*:get');
		}

		isPermittedViewProfileDates() {
			return this.isPermitted('*:person:*:get:dates');
		}
	}

	return new ProfilePermissionService();
});
