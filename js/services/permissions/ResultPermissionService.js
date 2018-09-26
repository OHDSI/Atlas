define([
  'providers/PermissionService'
], function (
  PermissionService
) {
	class ResultPermissionService extends PermissionService {					
		isPermittedViewCdmResults() {
			return this.isPermitted('cdmresults:*:get');
		}
	}

	return new ResultPermissionService();
});
