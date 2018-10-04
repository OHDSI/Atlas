define([
    'services/AuthService',
], function (
	authService,
) {

	function isPermittedCreate() {
		return authService.isPermitted(`pathway-analysis:post`);
	}

	function isPermittedImport() {
		return authService.isPermitted(`pathway-analysis:import:post`);
	}

	function isPermittedList() {
		return authService.isPermitted(`pathway-analysis:get`);
	}

	function isPermittedLoad(id) {
		return authService.isPermitted(`pathway-analysis:${id}:get`);
	}

	function isPermittedUpdate(id) {
		return authService.isPermitted(`pathway-analysis:${id}:put`);
	}

	function isPermittedDelete(id) {
		return authService.isPermitted(`pathway-analysis:${id}:delete`);
	}

	function isPermittedListGenerations(id) {
		return authService.isPermitted(`pathway-analysis:${id}:generation:get`);
	}

	function isPermittedGenerate(id, sourceKey) {
		return authService.isPermitted(`pathway-analysis:${id}:generation:*:post`) && authService.isPermitted(`source:${sourceKey}:access`);
	}

	function isPermittedResults(sourceKey) {
		return authService.isPermitted(`pathway-analysis:generation:*:result:get`) && authService.isPermitted(`source:${sourceKey}:access`);
	}

	function isPermittedExportByGeneration(id) {
		return authService.isPermitted(`pathway-analysis:generation:${id}:design:get`);
	}

	function isPermittedExport(id) {
		return authService.isPermitted(`pathway-analysis:${id}:export:get`);
	}


	return {
		isPermittedCreate,
		isPermittedImport,
		isPermittedList,
		isPermittedLoad,
		isPermittedUpdate,
		isPermittedDelete,
		isPermittedListGenerations,
		isPermittedGenerate,
		isPermittedResults,
		isPermittedExportByGeneration,
		isPermittedExport
	};
});
