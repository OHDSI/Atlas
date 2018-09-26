define([
  'providers/PermissionService'
], function (
  PermissionService
) {
	class ConceptSetPermissionService extends PermissionService {
		isPermittedCreateConceptset() {
      return this.isPermitted('conceptset:post');
    }

    isPermittedReadConceptsets () {
        return this.isPermitted('conceptset:get');
    }

    isPermittedUpdateConceptset(conceptsetId) {
        return (
            this.isPermitted('conceptset:' + conceptsetId + ':put')
            && this.isPermitted('conceptset:' + conceptsetId + ':items:put')
          )
          || (
            this.isPermitted('conceptset:*:put')
            && this.isPermitted('conceptset:*:items:put')
          );
    }

    isPermittedDeleteConceptset(id) {
        return this.isPermitted('conceptset:' + id + ':delete');
    }
	}

	return new ConceptSetPermissionService();
});
