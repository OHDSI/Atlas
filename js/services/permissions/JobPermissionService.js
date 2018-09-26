define([
  'providers/PermissionService'
], function (
  PermissionService
) {
	class JobPermissionService extends PermissionService {					
		isPermittedReadJobs() {
      return this.isPermitted('job:execution:get');
    }
	}

	return new JobPermissionService();
});
