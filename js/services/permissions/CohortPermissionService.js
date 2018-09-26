define([
  'providers/PermissionService'
], function (
  PermissionService
) {
	class CohortPermissionService extends PermissionService {			
		isPermittedReadCohort(id) {
      return this.isPermitted('cohortdefinition:' + id + ':get') && this.isPermitted('cohortdefinition:sql:post');
    }

    isPermittedReadCohorts() {
        return this.isPermitted('cohortdefinition:get');
    }

    isPermittedCreateCohort() {
        return this.isPermitted('cohortdefinition:post');
    }

    isPermittedCopyCohort(id) {
        return this.isPermitted('cohortdefinition:' + id + ':copy:get');
    }

    isPermittedUpdateCohort(id) {
        var permission = 'cohortdefinition:' + id + ':put';
        return this.isPermitted(permission);
    }

    isPermittedDeleteCohort(id) {
        var permission = 'cohortdefinition:' + id + ':delete';
        var allPermissions = 'cohortdefinition:delete';
        return this.isPermitted(permission) || this.isPermitted(allPermissions);
    }

    isPermittedGenerateCohort(cohortId, sourceKey) {
        return this.isPermitted('cohortdefinition:' + cohortId + ':generate:' + sourceKey + ':get') &&
            this.isPermitted('cohortdefinition:' + cohortId + ':info:get');
    }

    isPermittedReadCohortReport(cohortId, sourceKey) {
        return this.isPermitted('cohortdefinition:' + cohortId + ':report:' + sourceKey + ':get');
    }
	}

	return new CohortPermissionService();
});
