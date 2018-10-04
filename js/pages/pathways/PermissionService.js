define([
	'providers/PermissionService',
	'providers/AutoBind',
], function (
	PermissionService,
	AutoBind,
) {

	class PathwayPermissionService extends AutoBind(PermissionService) {
		isPermittedCreate() {
			return this.isPermitted(`pathway-analysis:post`);
		}
	
		isPermittedImport() {
			return this.isPermitted(`pathway-analysis:import:post`);
		}
	
		isPermittedList() {
			return this.isPermitted(`pathway-analysis:get`);
		}
	
		isPermittedLoad(id) {
			return this.isPermitted(`pathway-analysis:${id}:get`);
		}
	
		isPermittedUpdate(id) {
			return this.isPermitted(`pathway-analysis:${id}:put`);
		}
	
		isPermittedDelete(id) {
			return this.isPermitted(`pathway-analysis:${id}:delete`);
		}
	
		isPermittedListGenerations(id) {
			return this.isPermitted(`pathway-analysis:${id}:generation:get`);
		}
	
		isPermittedGenerate(id, sourceKey) {
			return this.isPermitted(`pathway-analysis:${id}:generation:*:post`) && authService.isPermitted(`source:${sourceKey}:access`);
		}
	
		isPermittedResults(sourceKey) {
			return this.isPermitted(`pathway-analysis:generation:*:result:get`) && authService.isPermitted(`source:${sourceKey}:access`);
		}
	
		isPermittedExportByGeneration(id) {
			return this.isPermitted(`pathway-analysis:generation:${id}:design:get`);
		}
	
		isPermittedExport(id) {
			return this.isPermitted(`pathway-analysis:${id}:export:get`);
		}
	}


	return new PathwayPermissionService();
});
