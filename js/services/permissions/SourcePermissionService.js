define([
  'providers/PermissionService'
], function (
  PermissionService
) {
	class SourcePermissionService extends PermissionService {					
		isPermittedCreateSource() {
      return this.isPermitted('source:post');
    }

    isPermittedReadSource(key) {
      return this.isPermitted('source:' + key + ':get');
    }

    isPermittedCheckSourceConnection(key) {
      return this.isPermitted('source:connection:' + key + ':get');
    }

    isPermittedEditSource(key) {
      return this.isPermitted('source:' + key + ':put');
    }

    isPermittedDeleteSource(key) {
      return this.isPermitted('source:' + key + ':delete');
    }
    
    isPermittedEditSourcePriority() {
			return this.isPermitted('source:*:daimons:*:set-priority:post');
		}
	}

	return new SourcePermissionService();
});
