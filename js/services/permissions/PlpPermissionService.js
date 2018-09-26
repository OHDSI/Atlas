define([
  'providers/PermissionService'
], function (
  PermissionService
) {
	class PlpPermissionService extends PermissionService {				
		isPermittedReadPlps() {
      return this.isPermitted('plp:get');
    }

    isPermittedCreatePlp () {
      return this.isPermitted('plp:post');
    }

    isPermittedReadPlp(id) {
      return this.isPermitted('plp:' + id + ':get');
    }

    isPermittedDeletePlp(id) {
      return this.isPermitted('plp:' + id + ':delete');
    }

    isPermittedCopyPlp(id) {
      return this.isPermitted(`plp:${id}:copy:get`);
    }
	}

	return new PlpPermissionService();
});
