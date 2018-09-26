define([
  'providers/PermissionService'
], function (
  PermissionService
) {
	class EstimationPermissionService extends PermissionService {		
		isPermittedReadEstimations() {
			return this.isPermitted('comparativecohortanalysis:get');
		}

		isPermittedReadEstimation(id) {
			return this.isPermitted('comparativecohortanalysis:' + id + ':get');
		}

		isPermittedCreateEstimation() {
				return this.isPermitted('comparativecohortanalysis:post');
		}

		isPermittedDeleteEstimation(id) {
				return this.isPermitted(`comparativecohortanalysis:${id}:delete`);
		}
	}

	return new EstimationPermissionService();
});
