define([
  'providers/PermissionService'
], function (
  PermissionService
) {
	class IRPermissionService extends PermissionService {
		isPermittedReadIRs() {
			return this.isPermitted('ir:get');
		}

		isPermittedEditIR(id) {
			return this.isPermitted('ir:' + id + ':put');
		}

		isPermittedCreateIR() {
			return this.isPermitted('ir:post');
		}

		isPermittedDeleteIR(id) {
				return this.isPermitted('ir:' + id + ':delete');
		}
		
		isPermittedCopyIR(id) {
				return this.isPermitted('ir:' + id + ':copy:get');
		}
	}

	return new IRPermissionService();
});
