define([
  'providers/PermissionService'
], function (
  PermissionService
) {
	class SearchPermissionService extends PermissionService {					
		isPermittedSearch() {
			return this.isPermitted('vocabulary:*:search:*:get');
		}
	}

	return new SearchPermissionService();
});
